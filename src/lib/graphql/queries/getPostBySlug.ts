const GET_POST_BY_SLUG = `
  query GetPostBySlug($slug: String!) {
    posts(first: 1) {
      nodes {
        slug
      }
    }
    postBy(slug: $slug) {
      id
      title
      date
      content
      featuredImage {
        node {
          sourceUrl
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
