const ALL_POSTS_QUERY = `
  query AllPosts {
    posts(first: 4) {
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
