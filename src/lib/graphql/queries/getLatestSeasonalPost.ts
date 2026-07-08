const GET_LATEST_SEASONAL_POST_QUERY = `
  query GetLatestSeasonalPost {
    posts(first: 1, where: { categoryName: "seasonal" }) {
      nodes {
        slug
        title
        date
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
      }
    }
  }
`;

export default GET_LATEST_SEASONAL_POST_QUERY;
