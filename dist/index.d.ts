/**
 *  Library for building React forms easily
 */
import React from "react";
/**
 * Form field definition type
 */
export interface FieldOption<TValue, TFields> {
    title: string | ((form: Form<TFields>) => string);
    hint?: React.ReactNode;
    readOnly?: boolean | ((form: Form<TFields>) => boolean);
    defaultValue: TValue | (() => TValue);
    validate?: (value: TValue, field: FieldOption<TValue, TFields>, form: Form<TFields>) => string;
    required?: boolean | ((form: Form<TFields>) => boolean);
    placeHolderText?: string;
    onChange?: (value: TValue, field: FieldOption<TValue, TFields>, form: Form<TFields>) => void;
}
/**
 * Form field value type
 */
export interface Field<TValue> {
    value: TValue;
    validation: string;
}
/**
 * Form fields definitions type
 */
export declare type FieldsOptions<TFields> = {
    [P in keyof TFields]: FieldOption<TFields[P], TFields>;
};
/**
 * Form fields values type
 */
export declare type Fields<TFields> = {
    [P in keyof TFields]: Field<TFields[P]>;
};
/**
 * Form options type
 */
export interface FormOptions<TFields> {
    /**
     * Fields definitions
     */
    fields: FieldsOptions<TFields>;
    /**
     * Fired after changing some form value
     */
    onChangeForm?: (form: Form<TFields>) => void;
}
/**
 * Form definition type
 */
export declare class Form<TFields> {
    private options;
    parent?: Form<any> | undefined;
    private _fields;
    private _validated;
    private _readOnly;
    private _childs;
    /**
     * @param options Form options
     * @param parent Parent form that subsequently calls some methods of this form
     */
    constructor(options: FormOptions<TFields>, parent?: Form<any> | undefined);
    private setDefaultFields;
    private handleChangeForm;
    /**
     * Adds child (form or form collection)
     */
    addChild: (child: Form<any> | FormCollection<any>) => void;
    /**
     * Returns field value, validation and options
     */
    get: <TField extends keyof TFields>(field: TField) => Fields<TFields>[TField] & {
        options: FieldsOptions<TFields>[TField];
    };
    /**
     * Set field value
     */
    set: <TField extends keyof TFields>(field: TField, value: TFields[TField]) => void;
    /**
     * Returns true if field is read only
     */
    isFieldReadOnly: <TField extends keyof TFields>(field: TField) => boolean;
    /**
     * Returns true if field is required
     */
    isFieldRequired: (field: keyof TFields) => boolean;
    /**
     * Returns title of the field
     */
    getFieldTitle: (field: keyof TFields) => string;
    /**
     * True if form has been validated. (It may still contain invalid values!)
     */
    get validated(): boolean;
    /**
     * Form has been validated and contains valid values
     */
    get valid(): boolean;
    /**
     * Validate whole form
     */
    validate: () => void;
    /**
     * Validate the field
     */
    validateField: <TField extends keyof TFields>(field: TField) => void;
    /**
     * Clear all validation messages and set form to unvalidated state
     */
    clearValidations: () => void;
    /**
     * Returns field values
     */
    get fields(): Partial<TFields>;
    /**
     * Set fields values
     */
    set fields(fields: Partial<TFields>);
    /**
     * Set default values for all fields
     */
    clearFields: () => Promise<void>;
    /**
     * Set whole form as readonly
     */
    set readOnly(readOnly: boolean);
    /**
     * Return true if whole form is set as readonly
     */
    get readOnly(): boolean;
}
/**
 * Form collection
 */
export declare class FormCollection<TFields> {
    private options;
    parent?: Form<any> | undefined;
    private _forms;
    constructor(options: FormOptions<TFields>, parent?: Form<any> | undefined);
    /**
     *
     * Add new form to collection with parametrized options
     */
    addWithOptions: (options: FormOptions<TFields>) => Form<TFields>;
    /**
     * Add new form to collection with standard options
     */
    add: () => Form<TFields>;
    /**
     *
     * Remove given form
     */
    remove: (form: Form<TFields>) => void;
    /**
     * Return forms
     */
    get: () => Form<TFields>[];
    /**
     * Validate all forms
     */
    validate: () => Promise<void>;
    /**
     * Sets all fields of all forms to their's default values
     */
    clearFields: () => void;
    /**
     * Clear validations messages of all forms
     */
    clearValidations: () => void;
    /**
     * Returns true if all forms has been validated and are valid
     */
    get valid(): boolean;
    /**
     * Returns true if all forms has been validated (they may still be invalid!)
     */
    get validated(): boolean;
    /**
     * Sets fields values for all forms
     */
    set fields(fields: TFields[]);
    /**
     * Sets readOnly mode for all forms
     */
    set readOnly(readOnly: boolean);
}
