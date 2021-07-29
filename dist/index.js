"use strict";
/**
 *  Library for building React forms easily
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormCollection = exports.Form = void 0;
const mobx_1 = require("mobx");
/**
 * Form definition type
 */
class Form {
    /**
     * @param options Form options
     * @param parent Parent form that subsequently calls some methods of this form
     */
    constructor(options, parent) {
        this.options = options;
        this.parent = parent;
        this._fields = {};
        this._validated = false;
        this._readOnly = false;
        this._childs = [];
        this.setDefaultFields = () => {
            for (let i in this.options.fields) {
                this._fields[i] = {
                    value: this.options.fields[i].defaultValue,
                    validation: ""
                };
            }
        };
        this.handleChangeForm = () => {
            const onChangeForm = this.options.onChangeForm;
            if (onChangeForm) {
                onChangeForm(this);
            }
        };
        /**
         * Adds child (form or form collection)
         */
        this.addChild = (child) => {
            this._childs.push(child);
        };
        /**
         * Returns field value, validation and options
         */
        this.get = (field) => {
            return Object.assign(Object.assign({}, this._fields[field]), { options: this.options.fields[field] });
        };
        /**
         * Set field value
         */
        this.set = (field, value) => {
            const options = this.options.fields[field];
            this._fields[field].value = value;
            this._fields[field].validation = this._validated && options.validate ? options.validate(value, options, this) : "";
            const onChange = this.options.fields[field].onChange;
            if (onChange) {
                onChange(value, this.options.fields[field], this);
            }
            this.handleChangeForm();
        };
        /**
         * Returns true if field is read only
         */
        this.isFieldReadOnly = (field) => {
            var _a;
            const fieldOptions = this.options.fields[field];
            let result = false;
            if (this.readOnly) {
                result = true;
            }
            else if (typeof fieldOptions.readOnly === "boolean") {
                result = (_a = fieldOptions.readOnly) !== null && _a !== void 0 ? _a : false;
            }
            else if (typeof fieldOptions.readOnly === "function") {
                result = fieldOptions.readOnly(this);
            }
            return result;
        };
        /**
         * Returns true if field is required
         */
        this.isFieldRequired = (field) => {
            const requiredFlag = this.options.fields[field].required;
            if (typeof requiredFlag === "boolean") {
                return requiredFlag;
            }
            if (typeof requiredFlag === "function") {
                return requiredFlag(this);
            }
            return false;
        };
        /**
         * Returns title of the field
         */
        this.getFieldTitle = (field) => {
            const title = this.options.fields[field].title;
            return typeof title === "function" ? title(this) : title;
        };
        /**
         * Validate whole form
         */
        this.validate = () => {
            for (let i in this._fields) {
                const options = this.options.fields[i];
                this._fields[i].validation = options.validate ? options.validate(this._fields[i].value, options, this) : "";
            }
            this._validated = true;
            this._childs.map(i => i.validate());
        };
        /**
         * Validate the field
         */
        this.validateField = (field) => {
            const options = this.options.fields[field];
            this._fields[field].validation = options.validate ? options.validate(this._fields[field].value, options, this) : "";
        };
        /**
         * Clear all validation messages and set form to unvalidated state
         */
        this.clearValidations = () => {
            for (let i in this._fields) {
                this._fields[i].validation = "";
            }
            this._childs.map(i => i.clearValidations());
            this._validated = false;
        };
        /**
         * Set default values for all fields
         */
        this.clearFields = () => __awaiter(this, void 0, void 0, function* () {
            this.setDefaultFields();
            this._validated = false;
            this._childs.map(i => i.clearFields());
            this.handleChangeForm();
        });
        this.setDefaultFields();
        if (parent) {
            parent._childs.push(this);
        }
        mobx_1.makeObservable(this, {
            _fields: mobx_1.observable,
            _validated: mobx_1.observable,
            _readOnly: mobx_1.observable
        });
    }
    /**
     * True if form has been validated. (It may still contain invalid values!)
     */
    get validated() {
        return this._validated && this._childs.map(i => i.validated).length === this._childs.length;
    }
    /**
     * Form has been validated and contains valid values
     */
    get valid() {
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
     * Returns field values
     */
    get fields() {
        const result = {};
        const fields = this._fields;
        for (let p in fields) {
            result[p] = fields[p].value;
        }
        return result;
    }
    /**
     * Set fields values
     */
    set fields(fields) {
        for (let i in this._fields) {
            const field = fields[i];
            this._fields[i].value = field !== null && field !== void 0 ? field : this._fields[i].value;
        }
        this.handleChangeForm();
    }
    /**
     * Set whole form as readonly
     */
    set readOnly(readOnly) {
        this._readOnly = readOnly;
        for (let i of this._childs) {
            i.readOnly = readOnly;
        }
    }
    /**
     * Return true if whole form is set as readonly
     */
    get readOnly() {
        return this._readOnly;
    }
}
exports.Form = Form;
/**
 * Form collection
 */
class FormCollection {
    constructor(options, parent) {
        this.options = options;
        this.parent = parent;
        /**
         *
         * Add new form to collection with parametrized options
         */
        this.addWithOptions = (options) => {
            const newForm = new Form(options !== null && options !== void 0 ? options : this.options, this.parent);
            this._forms.push(newForm);
            return newForm;
        };
        /**
         * Add new form to collection with standard options
         */
        this.add = () => {
            return this.addWithOptions(this.options);
        };
        /**
         *
         * Remove given form
         */
        this.remove = (form) => {
            this._forms = this._forms.filter(i => i !== form);
        };
        /**
         * Return forms
         */
        this.get = () => {
            return this._forms;
        };
        /**
         * Validate all forms
         */
        this.validate = () => __awaiter(this, void 0, void 0, function* () {
            this._forms.forEach(i => i.validate());
        });
        /**
         * Sets all fields of all forms to their's default values
         */
        this.clearFields = () => {
            this._forms.forEach(i => i.clearFields());
        };
        /**
         * Clear validations messages of all forms
         */
        this.clearValidations = () => {
            this._forms.forEach(i => i.clearValidations());
        };
        this._forms = [];
        if (parent) {
            parent.addChild(this);
        }
        mobx_1.makeObservable(this, {
            _forms: mobx_1.observable
        });
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
    get validated() {
        return this._forms.length === this._forms.map(i => i.validated).length;
    }
    /**
     * Sets fields values for all forms
     */
    set fields(fields) {
        this._forms = [];
        fields.forEach(i => { this.add().fields = i; });
    }
    /**
     * Sets readOnly mode for all forms
     */
    set readOnly(readOnly) {
        this._forms.forEach(i => i.readOnly = readOnly);
    }
}
exports.FormCollection = FormCollection;
