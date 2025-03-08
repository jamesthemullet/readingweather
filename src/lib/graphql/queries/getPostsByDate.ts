const GET_POSTS_BY_DATE = `
  query GetPostsByDate($year: Int!, $month: Int!) {
    posts(where: { dateQuery: { year: $year, month: $month } }) {
      nodes {
        title
        slug
        date
      }
    }
  }
`;

export default GET_POSTS_BY_DATE;
