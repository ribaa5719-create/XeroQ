const test = require('node:test')
const assert = require('node:assert/strict')

const { requestPasswordReset } = require('../controllers/authController')
const User = require('../models/User')

const makeResponse = () => {
  const res = {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.payload = payload
      return this
    },
  }

  return res
}

test('requestPasswordReset rejects ambiguous both-or-neither recovery inputs before any lookup', async () => {
  const originalFindOne = User.findOne
  const originalUpdateOne = User.updateOne
  let findOneCalls = 0

  User.findOne = async () => {
    findOneCalls += 1
    return null
  }
  User.updateOne = async () => ({})

  try {
    const cases = [
      {
        label: 'both provided',
        body: {
          identifier: 'alice@example.com',
          recoveryCode: 'ABC123',
          securityAnswer: 'private answer',
        },
        expectedMessage: /Choose one recovery method/i,
      },
      {
        label: 'neither provided',
        body: {
          identifier: 'alice@example.com',
          recoveryCode: '',
          securityAnswer: null,
        },
        expectedMessage: /A recovery code or security answer is required/i,
      },
    ]

    for (const testCase of cases) {
      findOneCalls = 0
      const req = { body: testCase.body }
      const res = makeResponse()

      await requestPasswordReset(req, res, () => {
        throw new Error(`${testCase.label}: next should not be called for invalid input`)
      })

      assert.equal(res.statusCode, 400, `${testCase.label} should reject invalid input`)
      assert.equal(findOneCalls, 0, `${testCase.label} should not query the database`)
      assert.equal(res.payload.status, 'error', `${testCase.label} should return an error payload`)
      assert.match(res.payload.message, testCase.expectedMessage, `${testCase.label} message should match expected validation`) 
    }
  } finally {
    User.findOne = originalFindOne
    User.updateOne = originalUpdateOne
  }
})
