const ALL_SEASONAL_POSTS_QUERY = `
  query AllPosts {
    posts(where: { categoryName: "seasonal" }) {
      nodes {
        date
        slug
        title
        featuredImage {
          node {
            sourceUrl(size: MEDIUM_LARGE)
            srcSet(size: MEDIUM_LARGE)
          }
        }
        content
      }
    }
  }
`;

export default ALL_SEASONAL_POSTS_QUERY;
