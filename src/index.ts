/**
 *  Library for building React forms easily
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
 * Form fields definitions
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

	/**
	 * 
	 * @param options Form options
	 * @param parent Parent form that subsequently calls some methods of this form
	 */
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
	 * Returns true if field is read only
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
	 * Returns field value, validation and options
	 */
	get = <TField extends keyof TFields>(field: TField) => {
		return {
			...this._fields[field],
			readOnly: this.isFieldReadOnly(field),
			options: this.options.fields[field]
		};
	}

	/**
	 * Returns true if field is required
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

	/**
	 * Returns title of field
	 */
	getFieldTitle = (field: keyof TFields) => {
		const title = this.options.fields[field].title;
		return typeof title === "function" ? title(this) : title;
	}

	/**
	 * Set field value
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
	 * Returns true if form has been validated. (It may still contain invalid values!)
	 */
	get validated(): boolean {
		return this._validated && this._subForms.map(i => i.validated).length === this._subForms.length;
	}

	/**
	 * Form has been validated and contains valid values
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
	 * Validate whole form
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
	 * Validate field
	 */
	validateField = <TField extends keyof TFields>(field: TField) => {
		const options = this.options.fields[field];
		this._fields[field].validation = options.validate ? options.validate(this._fields[field].value, options, this) : ""
	}

	/**
	 * Clear all validation messages and set form to unvalidated state
	 */
	clearValidations = () => {
		for (let i in this._fields) {
			this._fields[i].validation = ""
		}
		this._validated = false;
		this._subForms.map(i => i.clearValidations());
	}

	/**
	 * Returns field values
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
	 * Set fields values
	 */
	set fields(fields: Partial<TFields>) {
		for (let i in this._fields) {
			const field = fields[i];
			this._fields[i].value = field ?? this._fields[i].value;
		}

		this.handleChangeForm();
	}

	/**
	 * Set default values for all fields
	 */
	clearFields = async () => {
		this.setDefaultFields();
		this._validated = false;
		this._subForms.map(i => i.clearFields());
		this.handleChangeForm();
	}

	/**
	 * Set whole form as readonly
	 */
	set readOnly(readOnly: boolean) {
		this._readOnly = readOnly;
		for (let i of this._subForms) {
			i.readOnly = readOnly
		}
	}

	/**
	 * Return true if whole form is set as readonly
	 */
	get readOnly() {
		return this._readOnly;
	}
}

/**
 * Form collection
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

	/**
	 * Add new form to collection
	 */
	add = () => {
		return this.addWithOptions(this.options);
	}

	/**
	 * 
	 * Remove form from collections
	 */
	remove = (form: Form<TFields>) => {
		this.subForms = this.subForms.filter(i => i !== form);
	}

	/**
	 * Return subforms
	 */
	get = () => {
		return this.subForms;
	}

	/**
	 * Validate all subforms
	 */
	validate = async () => {
		this.subForms.forEach(i => i.validate())
	}

	/**
	 * Sets all fields in all subforms to default values
	 */
	clearFields = () => {
		this.subForms.forEach(i => i.clearFields())
	}

	/**
	 * Clear validations messages in all subforms
	 */
	clearValidations = () => {
		this.subForms.forEach(i => i.clearValidations())
	}

	/**
	 * Returns true if all subforms has been validated and are valid
	 */
	get isValid() {
		return this.subForms.length === this.subForms.map(i => i.isValid).length;
	}

	/**
	 * Returns true if all subforms has been validated (they may still be invalid!)
	 */
	get validated(): boolean {
		return this.subForms.length === this.subForms.map(i => i.validated).length;
	}

	/**
	 * Sets fields values for all subforms
	 */
	set fields(fields: TFields[]) {
		this.subForms = [];
		fields.forEach(i => { this.add().fields = i; });
	}

	/**
	 * Sets readOnly mode for all subforms
	 */
	set readOnly(readOnly: boolean) {
		this.subForms.forEach(i => i.readOnly = readOnly)
	}
}