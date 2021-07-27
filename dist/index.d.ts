/**
 *  Library for building forms
 */
import React from "react";
/**
 * Form field definition
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
 * Form field value
 */
export interface Field<TValue> {
    value: TValue;
    validation: string;
}
/**
 * Form fields definition
 */
export declare type FieldsOptions<TFields> = {
    [P in keyof TFields]: FieldOption<TFields[P], TFields>;
};
/**
 * Form fields values
 */
export declare type Fields<TFields> = {
    [P in keyof TFields]: Field<TFields[P]>;
};
/**
 * Form options
 */
export interface FormOptions<TFields> {
    fields: FieldsOptions<TFields>;
    onChangeForm?: (form: Form<TFields>) => void;
}
/**
 * Form
 */
export declare class Form<TFields> {
    private options;
    parent?: Form<any> | undefined;
    private _fields;
    private _validated;
    private _readOnly;
    private _subForms;
    constructor(options: FormOptions<TFields>, parent?: Form<any> | undefined);
    /**
     * Set default values for all fields
     */
    private setDefaultFields;
    private handleChangeForm;
    /**
     * Vrací zda je hodnota pouze pro čtení
     */
    isFieldReadOnly: <TField extends keyof TFields>(field: TField) => boolean;
    /**
     * Vrací hodnoty pole
     */
    get: <TField extends keyof TFields>(field: TField) => Fields<TFields>[TField] & {
        readOnly: boolean;
        options: FieldsOptions<TFields>[TField];
    };
    /**
     * Vrací zda je hodnota povinná
     */
    isFieldRequired: (field: keyof TFields) => boolean;
    getFieldTitle: (field: keyof TFields) => string;
    /**
     * Nastaví hodnotu pole
     */
    set: <TField extends keyof TFields>(field: TField, value: TFields[TField]) => void;
    /**
     * Formulář je validován. Avšak nemusí obsahovat validní hodnoty!
     */
    get validated(): boolean;
    /**
     * Formulář byl validován a obsahuje validní hodnoty.
     */
    get isValid(): boolean;
    /**
     * Provede validaci formuláře
     */
    validate: () => void;
    /**
     * Provede revalidaci fieldu, pokud již byl field validován
     */
    validateField: <TField extends keyof TFields>(field: TField) => void;
    /**
     * Odstraní provedené validace
     */
    clearValidations: () => void;
    /**
     * Vrací položky formuláře
     */
    get fields(): Partial<TFields>;
    /**
     * Nastaví položky formuláře
     */
    set fields(fields: Partial<TFields>);
    /**
     * Resetuje položky formuláře
     */
    clearFields: () => Promise<void>;
    set readOnly(readOnly: boolean);
    get readOnly(): boolean;
}
/**
 * Kolekce formulářů
 */
export declare class FormCollection<TFields> {
    private options;
    parentForm: Form<any>;
    private subForms;
    constructor(options: FormOptions<TFields>, parentForm: Form<any>);
    addWithOptions: (options: FormOptions<TFields>) => Form<TFields>;
    add: () => Form<TFields>;
    remove: (form: Form<TFields>) => void;
    get: () => Form<TFields>[];
    validate: () => Promise<void>;
    clearFields: () => void;
    clearValidations: () => void;
    get isValid(): boolean;
    get validated(): boolean;
    set fields(fields: TFields[]);
    set readOnly(readOnly: boolean);
}
