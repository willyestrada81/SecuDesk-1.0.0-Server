const { AuthenticationError, UserInputError } = require('apollo-server');

const checkAuth = require('../../util/check-auth');
const Log = require('../../models/Incident_logs');

module.exports = {
  Mutation: {
    createComment: async (_, { logId, body }, context) => {
      const { username } = checkAuth(context);
      if (body.trim() === '') {
        throw new UserInputError('Empty comment', {
          errors: {
            body: 'Comment body must not empty'
          }
        });
      }

      const log = await Log.findById(logId);

      if (log) {
        log.comments.unshift({
          logType,
          username,
          createdAt: new Date().toISOString()
        });
        await log.save();
        return log;
      } else throw new UserInputError('Log not found');
    },
    async deleteComment(_, { logId, commentId }, context) {
      const { username } = checkAuth(context);

      const log = await Log.findById(logId);

      if (log) {
        const commentIndex = log.comments.findIndex((c) => c.id === commentId);

        if (log.comments[commentIndex].username === username) {
          log.comments.splice(commentIndex, 1);
          await log.save();
          return log;
        } else {
          throw new AuthenticationError('Action not allowed');
        }
      } else {
        throw new UserInputError('Post not found');
      }
    }
  }
};
