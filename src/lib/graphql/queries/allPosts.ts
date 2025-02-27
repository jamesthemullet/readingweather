const ALL_POSTS_QUERY = `
  query AllPosts {
    posts {
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

export default ALL_POSTS_QUERY;
