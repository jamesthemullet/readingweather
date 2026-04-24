const GET_POSTS_BY_DAY = `
  query GetPostsByDay($year: Int!, $month: Int!, $day: Int!) {
    posts(where: { dateQuery: { year: $year, month: $month, day: $day } }) {
      nodes {
        title
        slug
        date
      }
    }
  }
`;

export default GET_POSTS_BY_DAY;
