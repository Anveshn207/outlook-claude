export type CustomFieldType = 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT' | 'MULTI_SELECT' | 'CHECKBOX' | 'URL' | 'EMAIL' | 'PHONE' | 'CURRENCY';
export type EntityType = 'candidate' | 'job' | 'client' | 'submission';

export interface SelectOption {
  label: string;
  value: string;
  color?: string;
}

export interface CustomField {
  id: string;
  entityType: EntityType;
  fieldName: string;
  fieldKey: string;
  fieldType: CustomFieldType;
  options: SelectOption[] | null;
  isRequired: boolean;
  isFilterable: boolean;
  isVisibleInList: boolean;
  displayOrder: number;
  createdAt: string;
}

export interface CreateCustomFieldRequest {
  entityType: EntityType;
  fieldName: string;
  fieldType: CustomFieldType;
  options?: SelectOption[];
  isRequired?: boolean;
  isFilterable?: boolean;
  isVisibleInList?: boolean;
  displayOrder?: number;
}
