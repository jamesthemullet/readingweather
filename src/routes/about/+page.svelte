<script lang="ts">
	import type { PageProps } from '../about/$types';

	const { data }: PageProps = $props();

	import '../../styles/index.css';
</script>

<svelte:head>
	<title>{data.page.title}</title>
	<meta name="description" content={data.page.seo.description} />
	<meta property="og:title" content={data.page.title} />
	<meta property="og:description" content={data.page.seo.description} />
	{#if data.page.featuredImage?.node?.sourceUrl}
		<meta property="og:image" content={data.page.featuredImage.node.sourceUrl} />
	{/if}
	<meta property="og:type" content="article" />
	<meta property="og:url" content={`https://www.readingweather.co.uk/${data.page.slug}`} />
</svelte:head>

{#if data.page}
	<h1>{data.page.title}</h1>
	<article class="post">
		<div class="content">{@html data.page.content}</div>
	</article>
{/if}

<main id="main" class="site-main">
	<article id="post-3487" class="post-3487 page type-page status-publish hentry">
		<header class="entry-header">
			<h1 class="entry-title">Subscribe</h1>
		</header>
		<!-- .entry-header -->

		<!--  -->

		<div class="entry-content">
			<div class="jetpack_subscription_widget">
				<h2 class="widgettitle">Subscribe to Blog via Email</h2>
				<div class="wp-block-jetpack-subscriptions__container">
					<form
						action="#"
						method="post"
						accept-charset="utf-8"
						id="subscribe-blog-1"
						data-blog="149167962"
						data-post_access_level="everybody"
					>
						<div id="subscribe-text">
							<p>
								Enter your email address to subscribe to this blog and receive notifications of new
								posts by email.
							</p>
						</div>
						<p id="subscribe-email">
							<label
								id="jetpack-subscribe-label"
								class="screen-reader-text"
								for="subscribe-field-1"
							>
								Email Address
							</label>
							<input
								type="email"
								name="email"
								required="required"
								value=""
								id="subscribe-field-1"
								placeholder="Email Address"
							/>
						</p>

						<p id="subscribe-submit">
							<input type="hidden" name="action" value="subscribe" />
							<input
								type="hidden"
								name="source"
								value="https://blog.readingweather.co.uk/subscribe/"
							/>
							<input type="hidden" name="sub-type" value="widget" />
							<input type="hidden" name="redirect_fragment" value="subscribe-blog-1" />
							<input type="hidden" id="_wpnonce" name="_wpnonce" value="a304dca4a2" /><input
								type="hidden"
								name="_wp_http_referer"
								value="/subscribe/"
							/>
							<button
								type="submit"
								class="wp-block-button__link"
								style="margin: 0px; margin-left: 0px;"
								name="jetpack_subscriptions_widget"
							>
								Subscribe <span class="jetpack-memberships-spinner">
									<svg
										width="24"
										height="24"
										viewBox="0 0 24 24"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z"
											opacity=".25"
											fill="currentColor"
										></path>
										<path
											d="M10.14,1.16a11,11,0,0,0-9,8.92A1.59,1.59,0,0,0,2.46,12,1.52,1.52,0,0,0,4.11,10.7a8,8,0,0,1,6.66-6.61A1.42,1.42,0,0,0,12,2.69h0A1.57,1.57,0,0,0,10.14,1.16Z"
											class="jetpack-memberships-spinner-rotating"
											fill="currentColor"
										></path>
									</svg></span
								></button
							>
						</p>
					</form>
				</div>
			</div>
		</div>
		<!-- .entry-content -->

		<footer class="entry-footer">
			<span class="edit-link"
				><a
					class="post-edit-link"
					href="https://blog.readingweather.co.uk/wp-admin/post.php?post=3487&amp;action=edit"
					>Edit <span class="screen-reader-text">Subscribe</span></a
				></span
			>
		</footer>
		<!-- .entry-footer -->
	</article>
	<!-- #post-3487 -->
</main>
