const ALL_POSTS_QUERY = `
  query AllPosts {
    posts {
      nodes {
        slug
        title
      }
    }
  }
`;

export default ALL_POSTS_QUERY;
