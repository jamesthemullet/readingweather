<?php
/**
 * readingweather functions and definitions
 *
 * @link https://developer.wordpress.org/themes/basics/theme-functions/
 *
 * @package readingweather
 */

if ( ! function_exists( 'readingweather_setup' ) ) :
	/**
	 * Sets up theme defaults and registers support for various WordPress features.
	 *
	 * Note that this function is hooked into the after_setup_theme hook, which
	 * runs before the init hook. The init hook is too late for some features, such
	 * as indicating support for post thumbnails.
	 */
	function readingweather_setup() {
		/*
		 * Make theme available for translation.
		 * Translations can be filed in the /languages/ directory.
		 * If you're building a theme based on readingweather, use a find and replace
		 * to change 'readingweather' to the name of your theme in all the template files.
		 */
		load_theme_textdomain( 'readingweather', get_template_directory() . '/languages' );

		// Add default posts and comments RSS feed links to head.
		add_theme_support( 'automatic-feed-links' );

		/*
		 * Let WordPress manage the document title.
		 * By adding theme support, we declare that this theme does not use a
		 * hard-coded <title> tag in the document head, and expect WordPress to
		 * provide it for us.
		 */
		add_theme_support( 'title-tag' );

		/*
		 * Enable support for Post Thumbnails on posts and pages.
		 *
		 * @link https://developer.wordpress.org/themes/functionality/featured-images-post-thumbnails/
		 */
		add_theme_support( 'post-thumbnails' );

		// This theme uses wp_nav_menu() in one location.
		register_nav_menus( array(
			'menu-1' => esc_html__( 'Primary', 'readingweather' ),
		) );

		/*
		 * Switch default core markup for search form, comment form, and comments
		 * to output valid HTML5.
		 */
		add_theme_support( 'html5', array(
			'search-form',
			'comment-form',
			'comment-list',
			'gallery',
			'caption',
		) );

		// Set up the WordPress core custom background feature.
		add_theme_support( 'custom-background', apply_filters( 'readingweather_custom_background_args', array(
			'default-color' => 'ffffff',
			'default-image' => '',
		) ) );

		// Add theme support for selective refresh for widgets.
		add_theme_support( 'customize-selective-refresh-widgets' );

		/**
		 * Add support for core custom logo.
		 *
		 * @link https://codex.wordpress.org/Theme_Logo
		 */
		add_theme_support( 'custom-logo', array(
			'height'      => 250,
			'width'       => 250,
			'flex-width'  => true,
			'flex-height' => true,
		) );
	}
endif;
add_action( 'after_setup_theme', 'readingweather_setup' );

/**
 * Set the content width in pixels, based on the theme's design and stylesheet.
 *
 * Priority 0 to make it available to lower priority callbacks.
 *
 * @global int $content_width
 */
function readingweather_content_width() {
	// This variable is intended to be overruled from themes.
	// Open WPCS issue: {@link https://github.com/WordPress-Coding-Standards/WordPress-Coding-Standards/issues/1043}.
	// phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound
	$GLOBALS['content_width'] = apply_filters( 'readingweather_content_width', 640 );
}
add_action( 'after_setup_theme', 'readingweather_content_width', 0 );

/**
 * Register widget area.
 *
 * @link https://developer.wordpress.org/themes/functionality/sidebars/#registering-a-sidebar
 */
function readingweather_widgets_init() {
	register_sidebar( array(
		'name'          => esc_html__( 'Sidebar', 'readingweather' ),
		'id'            => 'sidebar-1',
		'description'   => esc_html__( 'Add widgets here.', 'readingweather' ),
		'before_widget' => '<section id="%1$s" class="widget %2$s">',
		'after_widget'  => '</section>',
		'before_title'  => '<h2 class="widget-title">',
		'after_title'   => '</h2>',
	) );
}
add_action( 'widgets_init', 'readingweather_widgets_init' );
echo get_stylesheet_directory_uri();
/**
 * Enqueue scripts and styles.
 */
function readingweather_scripts() {
    global $wp_scripts;

	wp_enqueue_style( 'bootstrap_css', 'https://stackpath.bootstrapcdn.com/bootstrap/4.1.1/css/bootstrap.min.css');
	wp_enqueue_style('font-awesome', 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.9.0/css/all.min.css'); 
    
    wp_deregister_script('jquery');
	wp_enqueue_script('jquery', 'https://ajax.googleapis.com/ajax/libs/jquery/3.1.1/jquery.min.js', array(), null, true);    
    wp_enqueue_script( 'bootstrap_js', 'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js', array(), null, true);

	wp_enqueue_script( 'readingweather-navigation', get_template_directory_uri() . '/js/navigation.js', array(), '20151215', true );
	wp_enqueue_script( 'readingweather-skip-link-focus-fix', get_template_directory_uri() . '/js/skip-link-focus-fix.js', array(), '20151215', true );

	if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
		wp_enqueue_script( 'comment-reply' );
	}
}
add_action( 'wp_enqueue_scripts', 'readingweather_scripts' );

/**
 * Implement the Custom Header feature.
 */
require get_template_directory() . '/inc/custom-header.php';

/**
 * Custom template tags for this theme.
 */
require get_template_directory() . '/inc/template-tags.php';

/**
 * Functions which enhance the theme by hooking into WordPress.
 */
require get_template_directory() . '/inc/template-functions.php';

/**
 * Customizer additions.
 */
require get_template_directory() . '/inc/customizer.php';

/**
 * Load Jetpack compatibility file.
 */
if ( defined( 'JETPACK__VERSION' ) ) {
	require get_template_directory() . '/inc/jetpack.php';
}

add_action( 'wp_enqueue_scripts', 'enqueue_parent_styles' );

function enqueue_parent_styles() {
   wp_enqueue_style( 'https//www.readingweather.co.uk/wp-content/themes/readingnew/style.css' );
}

function my_custom_posttypes() {
    
    $labels = array(
        'name'               => 'Adverts',
        'singular_name'      => 'Advert',
        'menu_name'          => 'Adverts',
        'name_admin_bar'     => 'Advert',
        'add_new'            => 'Add New',
        'add_new_item'       => 'Add New Advert',
        'new_item'           => 'New Advert',
        'edit_item'          => 'Edit Advert',
        'view_item'          => 'View Advert',
        'all_items'          => 'All Adverts',
        'search_items'       => 'Search Adverts',
        'parent_item_colon'  => 'Parent Adverts:',
        'not_found'          => 'No advert sites found.',
        'not_found_in_trash' => 'No advert sites found in Trash.',
    );
    
    
    $args = array(
        'labels'             => $labels,
        'public'             => true,
        'publicly_queryable' => true,
        'show_ui'            => true,
        'show_in_menu'       => true,
        'menu_icon'          => 'dashicons-id-alt',
        'query_var'          => true,
        'rewrite'            => array( 'slug' => 'adverts' ),
        'capability_type'    => 'post',
        'has_archive'        => true,
        'hierarchical'       => false,
        'menu_position'      => 5,
        'supports'           => array( 'title', 'editor', 'thumbnail' ),
    );
    register_post_type('adverts', $args);
    
    $labels = array(
        'name'               => 'Adverts Mobile',
        'singular_name'      => 'Advert Mobile',
        'menu_name'          => 'Adverts Mobile',
        'name_admin_bar'     => 'Advert Mobile',
        'add_new'            => 'Add New',
        'add_new_item'       => 'Add New Advert Mobile',
        'new_item'           => 'New Advert Mobile',
        'edit_item'          => 'Edit Advert Mobile',
        'view_item'          => 'View Advert Mobile',
        'all_items'          => 'All Adverts Mobile',
        'search_items'       => 'Search Adverts Mobile',
        'parent_item_colon'  => 'Parent Adverts Mobile:',
        'not_found'          => 'No advert mobile sites found.',
        'not_found_in_trash' => 'No advert mobile sites found in Trash.',
    );
    
    
    $args = array(
        'labels'             => $labels,
        'public'             => true,
        'publicly_queryable' => true,
        'show_ui'            => true,
        'show_in_menu'       => true,
        'menu_icon'          => 'dashicons-id-alt',
        'query_var'          => true,
        'rewrite'            => array( 'slug' => 'adverts-mobile' ),
        'capability_type'    => 'post',
        'has_archive'        => true,
        'hierarchical'       => false,
        'menu_position'      => 5,
        'supports'           => array( 'title', 'editor', 'thumbnail' ),
    );
    register_post_type('adverts-mobile', $args);
}

add_action('init', 'my_custom_posttypes');

add_theme_support( 'post-thumbnails' );

add_action( 'after_setup_theme', 'aw_custom_add_image_sizes' );
function aw_custom_add_image_sizes() {
    add_image_size( 'small', 300, 9999 ); // 300px wide unlimited height
    add_image_size( 'medium-small', 450, 9999 ); // 300px wide unlimited height
    add_image_size( 'xl', 1200, 9999 ); // 1200px wide unlimited height
    add_image_size( 'xxl', 2000, 9999 ); // 2000px wide unlimited height
    add_image_size( 'xxxl', 3000, 9999 ); // 3000px wide unlimited height
    add_image_size( 'portfolio_full', 9999, 900 ); // 900px tall unlimited width

}

add_filter( 'image_size_names_choose', 'aw_custom_add_image_size_names' );
function aw_custom_add_image_size_names( $sizes ) {
  return array_merge( $sizes, array(
    'small' => __( 'Small' ),
    'medium-small' => __( 'Medium Small' ),
    'xl' => __( 'Extra Large' ),
    'xxl' => __( '2x Extra Large' ),
    'xxxl' => __( '3x Extra Large' ),
    'portfolio_full' => __( 'Portfolio Full Size' ),
  ) );
}
