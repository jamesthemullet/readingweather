const GET_POSTS_ON_THIS_DAY = `
  query GetPostsOnThisDay($month: Int!, $day: Int!) {
    posts(first: 10, where: { dateQuery: { month: $month, day: $day } }) {
      nodes {
        title
        slug
        date
      }
    }
  }
`;

export default GET_POSTS_ON_THIS_DAY;
