const GET_POSTS_FOR_GALLERY = `
  query GetPostsForGallery($year: Int!, $month: Int!) {
    posts(where: { dateQuery: { year: $year, month: $month } }, first: 100) {
      nodes {
        title
        slug
        date
        featuredImage {
          node {
            sourceUrl
          }
        }
      }
    }
  }
`;

export default GET_POSTS_FOR_GALLERY;
