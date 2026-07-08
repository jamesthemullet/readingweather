const ALL_SEASONAL_POSTS_QUERY = `
  query AllPosts {
    posts(first: 50, where: { categoryName: "seasonal" }) {
      nodes {
        date
        slug
        title
        featuredImage {
          node {
            sourceUrl(size: MEDIUM_LARGE)
            srcSet(size: MEDIUM_LARGE)
            mediaDetails {
              width
              height
            }
          }
        }
        content
      }
    }
  }
`;

export default ALL_SEASONAL_POSTS_QUERY;
