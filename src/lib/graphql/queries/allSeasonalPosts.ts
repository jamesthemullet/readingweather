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
        comments(where: { order: ASC }) {
          nodes {
            id
            content
            parentId
            author {
              node {
                name
              }
            }
            date
          }
        }
      }
    }
  }
`;

export default ALL_SEASONAL_POSTS_QUERY;
