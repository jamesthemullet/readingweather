<?php

$args = array( 
                'post_type' => 'adverts', 
                'posts_per_page' => 1,
                'orderby' => 'rand'
            );

            $adverts = new WP_Query( $args );

            while ( $adverts->have_posts() ) : $adverts->the_post();?>

                <!-- <div class="advert advert-main">
                    <div class="flex-site-title">
                        <?php the_content() ?>
                    </div>
                </div> -->

            <?php endwhile;

            $args = array( 
                'post_type' => 'adverts-mobile', 
                'posts_per_page' => 1,
                'orderby' => 'rand'
            );

            $advertsmobile = new WP_Query( $args );

            while ( $advertsmobile->have_posts() ) : $advertsmobile->the_post();?>

                <!-- <div class="advert advert-mobile">
                    <div class="flex-site-title">
                    <?php the_content() ?>
                    </div>
                </div> -->
            <?php endwhile;
            /**
             * travelify_before_main_container hook
             */
            do_action( 'travelify_before_main_container' );
                        
?>