/**
 *  Library for building forms
 */

import React from "react";
import { makeObservable, observable } from "mobx";

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
export type FieldsOptions<TFields> = {
	[P in keyof TFields]: FieldOption<TFields[P], TFields>
};

/**
 * Form fields values
 */
export type Fields<TFields> = {
	[P in keyof TFields]: Field<TFields[P]>
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
export class Form<TFields> {
	private _fields = {} as Fields<TFields>;
	private _validated = false;
	private _readOnly = false;
	private _subForms: (Form<any> | FormCollection<any>)[] = [];

	constructor(private options: FormOptions<TFields>, public parent?: Form<any>) {
		this.setDefaultFields();
		if (parent) {
			parent._subForms.push(this);
		}

		makeObservable<Form<TFields>,
			"_fields"
			| "_validated"
			| "_readOnly"

		>(this, {
			_fields: observable,
			_validated: observable,
			_readOnly: observable
		});
	}

	/**
	 * Set default values for all fields
	 */
	private setDefaultFields = () => {
		for (let i in this.options.fields) {
			this._fields[i] = {
				value: this.options.fields[i].defaultValue as any,
				validation: ""
			}
		}
	}

	private handleChangeForm = () => {
		const onChangeForm = this.options.onChangeForm;
		if (onChangeForm) {
			onChangeForm(this);
		}
	}

	/**
	 * Vrací zda je hodnota pouze pro čtení
	 */
	isFieldReadOnly = <TField extends keyof TFields>(field: TField) => {
		const fieldOptions = this.options.fields[field];
		let result = false;
		if (this.readOnly) {
			result = true;
		} else if (typeof fieldOptions.readOnly === "boolean") {
			result = fieldOptions.readOnly ?? false;
		} else if (typeof fieldOptions.readOnly === "function") {
			result = fieldOptions.readOnly(this);
		}
		return result;
	}

	/**
	 * Vrací hodnoty pole
	 */
	get = <TField extends keyof TFields>(field: TField) => {
		return {
			...this._fields[field],
			readOnly: this.isFieldReadOnly(field),
			options: this.options.fields[field]
		};
	}

	/**
	 * Vrací zda je hodnota povinná
	 */
	isFieldRequired = (field: keyof TFields) => {
		const requiredFlag = this.options.fields[field].required;
		if (typeof requiredFlag === "boolean") {
			return requiredFlag;
		}
		if (typeof requiredFlag === "function") {
			return requiredFlag(this);
		}

		return false;
	}

	getFieldTitle = (field: keyof TFields) => {
		const title = this.options.fields[field].title;
		return typeof title === "function" ? title(this) : title;
	}

	/**
	 * Nastaví hodnotu pole
	 */
	set = <TField extends keyof TFields>(field: TField, value: TFields[TField]) => {
		const options = this.options.fields[field];
		this._fields[field].value = value;
		this._fields[field].validation = this._validated && options.validate ? options.validate(value, options, this) : "";

		const onChange = this.options.fields[field].onChange;
		if (onChange) {
			onChange(value, this.options.fields[field], this);
		}

		this.handleChangeForm();
	}

	/**
	 * Formulář je validován. Avšak nemusí obsahovat validní hodnoty!
	 */
	get validated(): boolean {
		return this._validated && this._subForms.map(i => i.validated).length === this._subForms.length;
	}

	/**
	 * Formulář byl validován a obsahuje validní hodnoty.
	 */
	get isValid(): boolean {
		if (!this.validated) {
			return false;
		}

		for (let i in this._fields) {
			if (this._fields[i].validation !== "") {
				return false;
			}
		}

		return this._subForms.filter(i => i.isValid).length === this._subForms.length;
	}

	/**
	 * Provede validaci formuláře
	 */
	validate = () => {
		for (let i in this._fields) {
			const options = this.options.fields[i];
			this._fields[i].validation = options.validate ? options.validate(this._fields[i].value, options, this) : ""
		}
		this._validated = true;
		this._subForms.map(i => i.validate());
	}

	/**
	 * Provede revalidaci fieldu, pokud již byl field validován
	 */
	validateField = <TField extends keyof TFields>(field: TField) => {
		const options = this.options.fields[field];
		this._fields[field].validation = options.validate ? options.validate(this._fields[field].value, options, this) : ""
	}

	/**
	 * Odstraní provedené validace
	 */
	clearValidations = () => {
		for (let i in this._fields) {
			this._fields[i].validation = ""
		}
		this._validated = false;
		this._subForms.map(i => i.clearValidations());
	}

	/**
	 * Vrací položky formuláře
	 */
	get fields() {
		const result: any = {};
		const fields = this._fields;
		for (let p in fields) {
			result[p] = fields[p].value;
		}

		return result as TFields;
	}

	/**
	 * Nastaví položky formuláře
	 */
	set fields(fields: Partial<TFields>) {
		for (let i in this._fields) {
			const field = fields[i];
			this._fields[i].value = field ?? this._fields[i].value;
		}

		this.handleChangeForm();
	}

	/**
	 * Resetuje položky formuláře
	 */
	clearFields = async () => {
		this.setDefaultFields();
		this._validated = false;
		this._subForms.map(i => i.clearFields());
		this.handleChangeForm();
	}

	set readOnly(readOnly: boolean) {
		this._readOnly = readOnly;
		for (let i of this._subForms) {
			i.readOnly = readOnly
		}
	}

	get readOnly() {
		return this._readOnly;
	}
}

/**
 * Kolekce formulářů
 */
export class FormCollection<TFields> {
	private subForms: Form<TFields>[];

	constructor(private options: FormOptions<TFields>, public parentForm: Form<any>) {
		this.subForms = [];
	}

	addWithOptions = (options: FormOptions<TFields>) => {
		const newForm = new Form<TFields>(options ?? this.options, this.parentForm);
		this.subForms.push(newForm);
		return newForm;
	}

	add = () => {
		return this.addWithOptions(this.options);
	}

	remove = (form: Form<TFields>) => {
		this.subForms = this.subForms.filter(i => i !== form);
	}

	get = () => {
		return this.subForms;
	}

	validate = async () => {
		this.subForms.forEach(i => i.validate())
	}

	clearFields = () => {
		this.subForms.forEach(i => i.clearFields())
	}

	clearValidations = () => {
		this.subForms.forEach(i => i.clearValidations())
	}

	get isValid() {
		return this.subForms.length === this.subForms.map(i => i.isValid).length;
	}

	get validated(): boolean {
		return this.subForms.length === this.subForms.map(i => i.validated).length;
	}

	set fields(fields: TFields[]) {
		this.subForms = [];
		fields.forEach(i => { this.add().fields = i; });
	}

	set readOnly(readOnly: boolean) {
		this.subForms.forEach(i => i.readOnly = readOnly)
	}
}