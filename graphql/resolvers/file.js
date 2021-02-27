const checkAuth = require('../../util/check-auth')
const AWS = require('aws-sdk')

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
})

const s3 = new AWS.S3({ apiVersion: '2006-03-01' })

module.exports = {
  Mutation: {
    singleUpload: async (_, { file }, context) => {
      checkAuth(context)
      const { createReadStream, filename, mimetype, encoding } = await file
      const fileStream = createReadStream()

      try {
        const uploadParams = {
          Bucket: 'secu-desk',
          Key: filename,
          Body: fileStream,
          ACL: 'public-read'
        }
        const result = await s3.upload(uploadParams).promise()

        const newFile = {
          filename,
          location: result.Location,
          mimetype,
          encoding
        }
        return newFile
      } catch (error) {
        throw new Error(error)
      }
    }
  }
}
