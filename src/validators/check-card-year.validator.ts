import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function checkCardYear(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'checkCardYear',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          return value >= new Date().getFullYear();
        },
        defaultMessage(validationArguments) {
          return `Year of the card '${validationArguments.value}' must be greater than or equal ${new Date().getFullYear()}`;
        },
      },
    });
  };
}
