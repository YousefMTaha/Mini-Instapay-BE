import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function notMatch(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'notMatch',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return value !== args.object[args.constraints[0]];
        },
        defaultMessage(validationArguments) {
          return `${propertyName} can't be as same as ${validationArguments.constraints[0]}`;
        },
      },
    });
  };
}
