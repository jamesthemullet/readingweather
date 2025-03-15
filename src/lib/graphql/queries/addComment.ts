const ADD_COMMENT = `
  mutation AddComment($input: CreateCommentInput!) {
    createComment(input: $input) {
      success
    }
  }
`;

export default ADD_COMMENT;
