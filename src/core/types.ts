export interface GraphQLRequest<
  TVariables extends VariableValues = VariableValues,
> {
  query?: string;
  operationName?: string;
  variables?: TVariables;
  extensions?: Record<string, any>;
}

export type VariableValues = { [name: string]: any };

