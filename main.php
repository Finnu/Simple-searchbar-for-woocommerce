<?php
/*
Plugin Name: SAS
Plugin URI: https://github.com/Finnu/Simple-searchbar-for-woocommerce
Description: Simple ajax search for woocommerce.
Version: 1.0
Author: Finnu
Author URI: https://github.com/Finnu
License: A "Slug" license name e.g. GPL2
*/

class CodeFinnSAS{

    private static function load_config(){
        $path = __DIR__ . "/config.json";

        if(file_exists($path)){
            return json_decode(file_get_contents($path), true);
        }else{
            return array();
        }
    }

    public static function search_products($queryString){
        $result = array();

        //Limit -1 to get count of all products with specified name
        $params = array(
            'search' => $queryString,
            'status'  => 'publish',
            'limit'   => -1,
            'return'    => 'objects'
        );

        $query = new WC_Product_Query($params);

        $products = $query->get_products();

        $max = 5;
        $found_matching = 0;

        foreach ($products as $product) {
            $match = false;

            if(strpos(strtolower($product->get_name()), strtolower($queryString))){
                $match = true;
                $found_matching++;
            }

            if($found_matching <= $max && $match){
                $current  = array(
                    'name' => $product->get_name(),
                    'image' => $product->get_image(),
                    'url' => $product->get_permalink()
                );

                //detect if the product is variable or simple
                if($product->is_type('variable')){
                    $current["price"] = wc_price($product->get_variation_price( 'min', true ));
                }elseif($product->is_type('simple')){
                    $current["price"] = wc_price($product->get_price());
                }

                $productId = $product->get_id();

                //ACF support
                if(function_exists('get_field')){
                    $config = self::load_config();
                    if(isset($config["acf"])){
                        $fields = $config["acf"];
                        foreach ($fields as $field){
                            $field_value =  get_field($field, $productId);
                            if($field_value){
                                $current[$field] = $field_value;
                            }
                        }
                    }
                }

                $result[] = $current;
            }
        }

        return array("products" => $result, "amount" => $found_matching);

    }
}

function CodeFinnSASLookupProducts(){
    if(isset($_POST["search"])){
        $search = sanitize_text_field($_POST["search"]);

        check_ajax_referer('SASAPI_NONCE', 'nonce');

        $results = array();

        $results = CodeFinnSAS::search_products($search);

        $response = [
            'success' => true,
            'data' => $results,
            'identifier' => $search,
            'json_last_error' => json_last_error()
        ];

        wp_send_json($response);
    }
}

add_action('wp_ajax_GetProductsBySearchName', 'CodeFinnSASLookupProducts');


function CodeFinnSASAPI() {
    wp_localize_script('jquery', 'codefinn_sas_api', [
        'ajax_url' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('SASAPI_NONCE'),
    ]);
}

function CodeFinnSASInit(){
    ?>
    <script>let currentHost = `<?=get_site_url()?>`;</script>
    <script src="<?=plugin_dir_url(__FILE__).'searchEngine.js'?>"></script>
    <?php
    if(file_exists(__DIR__."/searchUI.css")){
        ?>
        <style>
            <?=file_get_contents(__DIR__."/searchUI.css")?>
        </style>
        <?php
    }
    ?>
    <div id="CodeFinnSAS"></div>
    <?php
}
add_shortcode("codefinn_search_products", 'CodeFinnSASInit');
add_action('wp_enqueue_scripts', 'CodeFinnSASAPI');
