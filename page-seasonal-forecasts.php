<?php
/**
 * The template for displaying all pages
 *
 * This is the template that displays all pages by default.
 * Please note that this is the WordPress construct of pages
 * and that other 'pages' on your WordPress site may use a
 * different template.
 *
 * @link https://developer.wordpress.org/themes/basics/template-hierarchy/
 *
 * @package readingweather
 */

get_header();
?>

	<div id="primary" class="content-area">
        <?php
        include get_template_directory() . '/includes/adverts.php';
        ?>
		<main id="main" class="site-main">
        <h2>Seasonal Forecasts</h2>

		<?php
        // the query
        $the_query = new WP_Query(array(
            'category_name' => 'seasonal',
            'post_status' => 'publish',
            'posts_per_page' => 5,
        ));
        ?>

        <?php if ($the_query->have_posts()) : ?>
            <?php while ($the_query->have_posts()) : $the_query->the_post(); ?>
                <article>
                    <?php the_post_thumbnail(); ?>
                    <header class="entry-header">
                        <h3><?php the_title(); ?></h3>
                    </header>
                    <div class="entry-content">
                        <?php the_content(); ?>
                    </div>
                </article>
            <?php endwhile; ?>
            <?php wp_reset_postdata(); ?>

        <?php else : ?>
            <p><?php __('No News'); ?></p>
        <?php endif; ?>

		</main><!-- #main -->
	</div><!-- #primary -->

<?php
get_sidebar();
get_footer();
