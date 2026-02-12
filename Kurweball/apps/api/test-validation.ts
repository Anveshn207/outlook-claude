import 'reflect-metadata';
import { validate } from './src/common/env.validation';

// Test 1: Valid config
console.log('\nTest 1: Valid config');
try {
  validate({
    DATABASE_URL: 'postgresql://localhost:5432/test',
    JWT_SECRET: 'test-secret',
    JWT_REFRESH_SECRET: 'test-refresh-secret',
    PORT: 3001,
  });
  console.log('✓ Validation passed');
} catch (error) {
  console.error('✗ Validation failed:', error.message);
}

// Test 2: Missing required field
console.log('\nTest 2: Missing DATABASE_URL');
try {
  validate({
    JWT_SECRET: 'test-secret',
    JWT_REFRESH_SECRET: 'test-refresh-secret',
  });
  console.log('✗ Validation should have failed');
} catch (error) {
  console.log('✓ Validation failed as expected');
  console.log('Error:', error.message.split('\n')[0]);
}

// Test 3: Invalid PORT type
console.log('\nTest 3: Invalid PORT (negative number)');
try {
  validate({
    DATABASE_URL: 'postgresql://localhost:5432/test',
    JWT_SECRET: 'test-secret',
    JWT_REFRESH_SECRET: 'test-refresh-secret',
    PORT: -1,
  });
  console.log('✗ Validation should have failed');
} catch (error) {
  console.log('✓ Validation failed as expected');
  console.log('Error:', error.message.split('\n')[0]);
}

// Test 4: Optional fields can be omitted
console.log('\nTest 4: Optional fields omitted');
try {
  validate({
    DATABASE_URL: 'postgresql://localhost:5432/test',
    JWT_SECRET: 'test-secret',
    JWT_REFRESH_SECRET: 'test-refresh-secret',
  });
  console.log('✓ Validation passed with optional fields omitted');
} catch (error) {
  console.error('✗ Validation failed:', error.message);
}

console.log('\nAll tests completed!');
