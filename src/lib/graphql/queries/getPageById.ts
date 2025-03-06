const GET_PAGE_BY_ID = `
  query GetPageById($id: ID!) {
    page(id: $id, idType: DATABASE_ID) {
      title
      content
      seo {
        opengraphDescription
      }
      featuredImage {
        node {
          sourceUrl
        }
      }
    }
  }
`;

export default GET_PAGE_BY_ID;
