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
        global $wpdb;

        $result = array();

        $sql = $wpdb->prepare(
            "SELECT id FROM wp_posts WHERE post_type = 'product' and post_status = 'publish' and lower(post_title) LIKE concat('%', %s, '%');",
            $queryString
        );

        $query = $wpdb->get_results($sql);
        $ids = array();

        foreach($query as $product){
            $ids[] = $product->id;
        }

        $products = wc_get_products([
                "include" => $ids,
        ]);

        $max = 5;
        $found_matching = 0;

        foreach ($products as $product) {
            if($found_matching <= $max){
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
            $found_matching++;
        }

        return array("products" => $result, "amount" => $found_matching);

    }
}

function CodeFinnSASLookupProducts(){
    if(isset($_POST["SASLookupProducts"])){
        $search = sanitize_text_field($_POST["SASLookupProducts"]);

        if (!check_ajax_referer('SASAPI_NONCE', 'nonce', false)) {
            wp_send_json_error(['error' => 'Invalid nonce'], 400);
        }

        $results = array();

        $results = CodeFinnSAS::search_products($search);

        $response = [
            'success' => true,
            'data' => $results,
            'identifier' => $search,
            'json_last_error' => json_last_error()
        ];
        header('Content-Type: application/json');
        wp_send_json($response);
    }
}

add_action('wp_ajax_GetProductsBySearchName', 'CodeFinnSASLookupProducts');
add_action('wp_ajax_nopriv_GetProductsBySearchName', 'CodeFinnSASLookupProducts');


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
