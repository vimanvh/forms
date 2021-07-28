/**
 *  Library for building React forms easily
 */

import React from "react";
import { makeObservable, observable } from "mobx";

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
export type FieldsOptions<TFields> = {
	[P in keyof TFields]: FieldOption<TFields[P], TFields>
};

/**
 * Form fields values type
 */
export type Fields<TFields> = {
	[P in keyof TFields]: Field<TFields[P]>
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
export class Form<TFields> {
	private _fields = {} as Fields<TFields>;
	private _validated = false;
	private _readOnly = false;
	private _childs: (Form<any> | FormCollection<any>)[] = [];

	/**
	 * @param options Form options
	 * @param parent Parent form that subsequently calls some methods of this form
	 */
	constructor(private options: FormOptions<TFields>, public parent?: Form<any>) {
		this.setDefaultFields();
		if (parent) {
			parent._childs.push(this);
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
	 * Adds child (form or form collection)
	 */
	addChild = (child: Form<any> | FormCollection<any>) => {
		this._childs.push(child);
	}

	/**
	 * Returns field value, validation and options
	 */
	get = <TField extends keyof TFields>(field: TField) => {
		return {
			...this._fields[field],
			options: this.options.fields[field]
		};
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
	 * Returns title of the field
	 */
	getFieldTitle = (field: keyof TFields) => {
		const title = this.options.fields[field].title;
		return typeof title === "function" ? title(this) : title;
	}

	/**
	 * True if form has been validated. (It may still contain invalid values!)
	 */
	get validated(): boolean {
		return this._validated && this._childs.map(i => i.validated).length === this._childs.length;
	}

	/**
	 * Form has been validated and contains valid values
	 */
	get valid(): boolean {
		if (!this.validated) {
			return false;
		}

		for (let i in this._fields) {
			if (this._fields[i].validation !== "") {
				return false;
			}
		}

		return this._childs.filter(i => i.valid).length === this._childs.length;
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
		this._childs.map(i => i.validate());
	}

	/**
	 * Validate the field
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
		this._childs.map(i => i.clearValidations());
		this._validated = false;
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
		this._childs.map(i => i.clearFields());
		this.handleChangeForm();
	}

	/**
	 * Set whole form as readonly
	 */
	set readOnly(readOnly: boolean) {
		this._readOnly = readOnly;
		for (let i of this._childs) {
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
	private _forms: Form<TFields>[];

	constructor(private options: FormOptions<TFields>, public parent?: Form<any>) {
		this._forms = [];

		if (parent) {
			parent.addChild(this);
		}

		makeObservable<FormCollection<TFields>,
			"_forms"
		>(this, {
			_forms: observable
		});
	}

	/**
	 * 
	 * Add new form to collection with parametrized options
	 */
	addWithOptions = (options: FormOptions<TFields>) => {
		const newForm = new Form<TFields>(options ?? this.options, this.parent);
		this._forms.push(newForm);
		return newForm;
	}

	/**
	 * Add new form to collection with standard options
	 */
	add = () => {
		return this.addWithOptions(this.options);
	}

	/**
	 * 
	 * Remove given form
	 */
	remove = (form: Form<TFields>) => {
		this._forms = this._forms.filter(i => i !== form);
	}

	/**
	 * Return forms
	 */
	get = () => {
		return this._forms;
	}

	/**
	 * Validate all forms
	 */
	validate = async () => {
		this._forms.forEach(i => i.validate())
	}

	/**
	 * Sets all fields of all forms to their's default values
	 */
	clearFields = () => {
		this._forms.forEach(i => i.clearFields())
	}

	/**
	 * Clear validations messages of all forms
	 */
	clearValidations = () => {
		this._forms.forEach(i => i.clearValidations())
	}

	/**
	 * Returns true if all forms has been validated and are valid
	 */
	get valid() {
		return this._forms.length === this._forms.map(i => i.valid).length;
	}

	/**
	 * Returns true if all forms has been validated (they may still be invalid!)
	 */
	get validated(): boolean {
		return this._forms.length === this._forms.map(i => i.validated).length;
	}

	/**
	 * Sets fields values for all forms
	 */
	set fields(fields: TFields[]) {
		this._forms = [];
		fields.forEach(i => { this.add().fields = i; });
	}

	/**
	 * Sets readOnly mode for all forms
	 */
	set readOnly(readOnly: boolean) {
		this._forms.forEach(i => i.readOnly = readOnly)
	}
}