const GET_LATEST_POST_SLUG = `
  query GetLatestPostSlug {
    posts(first: 1) {
      nodes {
        slug
      }
    }
  }
`;

export default GET_LATEST_POST_SLUG;
