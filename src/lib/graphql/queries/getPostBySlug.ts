const GET_POST_BY_SLUG = `
  query GetPostBySlug($slug: String!) {
    postBy(slug: $slug) {
      id
      title
      slug
      excerpt
      date
      content
      featuredImage {
        node {
          altText
          sourceUrl(size: MEDIUM_LARGE)
          srcSet(size: MEDIUM_LARGE)
          altText
          mediaDetails {
            width
            height
          }
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
