# Database Model Tests

This directory contains unit tests for the Booking and Event models.

## Test Coverage

### Booking Model Tests (`booking.model.test.ts`)

1. **Email Validation**
   - Validates correct email formats (RFC 5322 compliant)
   - Rejects invalid email formats
   - Normalizes emails to lowercase
   - Trims whitespace from emails

2. **Event Existence Validation**
   - Prevents booking creation if eventId does not exist
   - Allows booking creation only when eventId is valid
   - Rejects invalid eventId formats

3. **Unique Booking Constraint**
   - Enforces one booking per event per email
   - Allows same email to book different events
   - Allows different emails to book same event
   - Treats email comparison as case-insensitive

### Event Model Tests (`event.model.test.ts`)

1. **Slug Generation**
   - Generates URL-friendly slug from title on save
   - Converts to lowercase
   - Replaces spaces with hyphens
   - Removes special characters
   - Handles edge cases (multiple spaces, leading/trailing hyphens)
   - Regenerates slug only when title is modified

2. **Date Normalization**
   - Normalizes various date formats to YYYY-MM-DD
   - Handles ISO date strings
   - Rejects invalid date formats
   - Updates normalized date on modification

3. **Time Normalization**
   - Converts 12-hour format (AM/PM) to 24-hour format
   - Pads single-digit hours with zero
   - Handles whitespace
   - Validates time ranges (0-23 hours, 0-59 minutes)
   - Rejects invalid time formats
   - Case-insensitive AM/PM handling

## Running Tests

### Install Dependencies
First, install the required test dependencies:
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Specific Test File
```bash
npm test booking.model.test.ts
# or
npm test event.model.test.ts
```

## Test Environment

The tests use:
- **Jest**: Testing framework
- **mongodb-memory-server**: In-memory MongoDB instance for isolated testing
- **ts-jest**: TypeScript support for Jest

Each test suite:
1. Creates a fresh in-memory MongoDB instance before all tests
2. Connects Mongoose to the test database
3. Cleans up all collections after each test
4. Disconnects and stops the MongoDB server after all tests

This ensures tests are isolated and don't affect your actual database.
