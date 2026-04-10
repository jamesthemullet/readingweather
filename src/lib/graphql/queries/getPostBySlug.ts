const GET_POST_BY_SLUG = `
  query GetPostBySlug($slug: String!) {
    postBy(slug: $slug) {
      id
      title
      content
      featuredImage {
        node {
          sourceUrl(size: MEDIUM_LARGE)
          srcSet(size: MEDIUM_LARGE)
        }
      }
      comments(first: 100, where: { order: ASC }) {
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
`;

export default GET_POST_BY_SLUG;
