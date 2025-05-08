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
    public static function search_products($queryString){

        //Limit -1 to get count of all products with specified name
        $params = array(
          'search' => $queryString,
          'status'  => 'publish',
          'limit'   => -1,
        );

        $query = new WC_Product_Query($params);

        $products = $query->get_products();

        $amount = $query->get_total();

        $result = array();

        foreach ($products as $product) {

            $current  = array(
                'name' => $product->get_name(),
                'price' => $product->get_price(),
                'image' => $product->get_image(),
                'url' => $product->get_permalink()
            );

            $productId = $product->get_id();

            //ACF support
            if(function_exists('get_field')){

            }

            $result[] = $current;
        }

        return array("products" => $result, "amount" => $amount);

    }
}


function CodefinnSASInit(){

}
add_shortcode("search_products", 'CodefinnSASInit');

