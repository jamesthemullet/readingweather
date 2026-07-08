const ALL_POSTS_QUERY = `
  query AllPosts {
    posts(first: 2) {
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

export default ALL_POSTS_QUERY;
