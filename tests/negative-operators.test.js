
import { Operators, Matchers } from '../src/core/filter-types';

describe('Negative Operators', () => {
    describe('NOT_EQUAL', () => {
        const matcher = Matchers[Operators.NOT_EQUAL];

        test('should return true when values are different', () => {
            expect(matcher('hello', 'world')).toBe(true);
        });

        test('should return false when values are same (case-insensitive)', () => {
            expect(matcher('Hello', 'hello')).toBe(false);
            expect(matcher('HELLO', 'hello')).toBe(false);
        });

        test('should return true when values differ by content', () => {
            expect(matcher('React', 'Vue')).toBe(true);
        });
    });

    describe('NOT_CONTAINS', () => {
        const matcher = Matchers[Operators.NOT_CONTAINS];

        test('should return true when value does not contain target', () => {
            expect(matcher('Hello World', 'Universe')).toBe(true);
        });

        test('should return false when value contains target', () => {
            expect(matcher('Hello World', 'World')).toBe(false);
        });

        test('should return false when value contains target (case-insensitive)', () => {
            expect(matcher('Hello World', 'world')).toBe(false);
            expect(matcher('Hello World', 'HELLO')).toBe(false);
        });
    });
});
