import { GraphQLResolveInfo } from 'graphql';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

export type Contact = {
  __typename?: 'Contact';
  address: PhysicalAddress;
  email: Scalars['String']['output'];
  googleMapsUrl: Scalars['String']['output'];
  phone: Scalars['String']['output'];
  website?: Maybe<Scalars['String']['output']>;
};

export type CreateFacilityInput = {
  contact: Contact;
  healthcareProfessionalIds?: InputMaybe<Array<Scalars['ID']['input']>>;
  nameEn: Scalars['String']['input'];
  nameJa: Scalars['String']['input'];
};

export type CreateHealthcareProfessionalInput = {
  acceptedInsurance?: InputMaybe<Array<Insurance>>;
  degrees?: InputMaybe<Array<Degree>>;
  facilityIds: Array<Scalars['ID']['input']>;
  names: Array<LocaleName>;
  specialties?: InputMaybe<Array<Specialty>>;
  spokenLanguages?: InputMaybe<Array<SpokenLanguage>>;
};

export type CreateSubmissionInput = {
  googleMapsUrl?: InputMaybe<Scalars['String']['input']>;
  healthcareProfessionalName?: InputMaybe<Scalars['String']['input']>;
  spokenLanguages?: InputMaybe<Array<SpokenLanguage>>;
};

export type Degree = {
  __typename?: 'Degree';
  abbreviation: Scalars['String']['output'];
  nameEn: Scalars['String']['output'];
  nameJa: Scalars['String']['output'];
};

export type Facility = {
  __typename?: 'Facility';
  contact: Contact;
  createdDate: Scalars['String']['output'];
  healthcareProfessionalIds: Array<Scalars['ID']['output']>;
  id: Scalars['ID']['output'];
  nameEn: Scalars['String']['output'];
  nameJa: Scalars['String']['output'];
  updatedDate: Scalars['String']['output'];
};

export type FacilitySearchFilters = {
  contact?: InputMaybe<Contact>;
  createdDate?: InputMaybe<Scalars['String']['input']>;
  healthcareProfessionalName?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  nameEn?: InputMaybe<Scalars['String']['input']>;
  nameJa?: InputMaybe<Scalars['String']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<OrderBy>>;
  updatedDate?: InputMaybe<Scalars['String']['input']>;
};

export type HealthcareProfessional = {
  __typename?: 'HealthcareProfessional';
  acceptedInsurance: Array<Insurance>;
  createdDate: Scalars['String']['output'];
  degrees: Array<Degree>;
  facilityIds: Array<Scalars['ID']['output']>;
  id: Scalars['ID']['output'];
  names: Array<LocaleName>;
  specialties: Array<Specialty>;
  spokenLanguages: Array<SpokenLanguage>;
  updatedDate: Scalars['String']['output'];
};

export type HealthcareProfessionalSearchFilters = {
  acceptedInsurance?: InputMaybe<Array<Insurance>>;
  createdDate?: InputMaybe<Scalars['String']['input']>;
  degrees?: InputMaybe<Array<Degree>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  names?: InputMaybe<Array<LocaleName>>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<OrderBy>>;
  specialties?: InputMaybe<Array<Specialty>>;
  spokenLanguages?: InputMaybe<Array<SpokenLanguage>>;
  updatedDate?: InputMaybe<Scalars['String']['input']>;
};

export enum Insurance {
  InsuranceNotAccepted = 'INSURANCE_NOT_ACCEPTED',
  InternationalHealthInsurance = 'INTERNATIONAL_HEALTH_INSURANCE',
  JapaneseHealthInsurance = 'JAPANESE_HEALTH_INSURANCE'
}

export enum Locale {
  English = 'ENGLISH',
  Japanese = 'JAPANESE'
}

export type LocaleName = {
  __typename?: 'LocaleName';
  firstName: Scalars['String']['output'];
  lastName: Scalars['String']['output'];
  locale: Locale;
  middleName: Scalars['String']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  createFacility?: Maybe<Facility>;
  createHealthcareProfessional?: Maybe<HealthcareProfessional>;
  createSubmission?: Maybe<Submission>;
  deleteFacility?: Maybe<Scalars['Boolean']['output']>;
  deleteHealthcareProfessional?: Maybe<Scalars['Boolean']['output']>;
  deleteSubmission?: Maybe<Scalars['Boolean']['output']>;
  updateFacility?: Maybe<Facility>;
  updateHealthcareProfessional?: Maybe<HealthcareProfessional>;
  updateSubmission?: Maybe<Submission>;
};


export type MutationCreateFacilityArgs = {
  input: CreateFacilityInput;
};


export type MutationCreateHealthcareProfessionalArgs = {
  input: CreateHealthcareProfessionalInput;
};


export type MutationCreateSubmissionArgs = {
  input: CreateSubmissionInput;
};


export type MutationDeleteFacilityArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteHealthcareProfessionalArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteSubmissionArgs = {
  id: Scalars['ID']['input'];
};


export type MutationUpdateFacilityArgs = {
  id: Scalars['ID']['input'];
  input: UpdateFacilityInput;
};


export type MutationUpdateHealthcareProfessionalArgs = {
  id: Scalars['ID']['input'];
  input: UpdateHealthcareProfessionalInput;
};


export type MutationUpdateSubmissionArgs = {
  id: Scalars['ID']['input'];
  input: UpdateSubmissionInput;
};

export type OrderBy = {
  fieldToOrder: Scalars['String']['input'];
  orderDirection: OrderDirection;
};

export enum OrderDirection {
  Asc = 'asc',
  Desc = 'desc'
}

export type PhysicalAddress = {
  __typename?: 'PhysicalAddress';
  addressLine1En: Scalars['String']['output'];
  addressLine1Ja: Scalars['String']['output'];
  addressLine2En: Scalars['String']['output'];
  addressLine2Ja: Scalars['String']['output'];
  cityEn: Scalars['String']['output'];
  cityJa: Scalars['String']['output'];
  postalCode: Scalars['String']['output'];
  prefectureEn: Scalars['String']['output'];
  prefectureJa: Scalars['String']['output'];
};

export type Query = {
  __typename?: 'Query';
  facilities?: Maybe<Array<Maybe<Facility>>>;
  facility?: Maybe<Facility>;
  healthcareProfessional?: Maybe<HealthcareProfessional>;
  healthcareProfessionals?: Maybe<Array<Maybe<HealthcareProfessional>>>;
  submission?: Maybe<Submission>;
  submissions?: Maybe<Array<Maybe<Submission>>>;
};


export type QueryFacilitiesArgs = {
  filters: FacilitySearchFilters;
};


export type QueryFacilityArgs = {
  id: Scalars['ID']['input'];
};


export type QueryHealthcareProfessionalArgs = {
  id: Scalars['ID']['input'];
};


export type QueryHealthcareProfessionalsArgs = {
  filters: HealthcareProfessionalSearchFilters;
};


export type QuerySubmissionArgs = {
  id: Scalars['ID']['input'];
};


export type QuerySubmissionsArgs = {
  filters: SubmissionSearchFilters;
};

export type Relationship = {
  __typename?: 'Relationship';
  action: RelationshipAction;
  otherEntityId: Scalars['ID']['output'];
};

export enum RelationshipAction {
  Create = 'CREATE',
  Delete = 'DELETE',
  Update = 'UPDATE'
}

export type Specialty = {
  __typename?: 'Specialty';
  names: Array<SpecialtyName>;
};

export type SpecialtyName = {
  __typename?: 'SpecialtyName';
  locale: Locale;
  name: Scalars['String']['output'];
};

export type SpokenLanguage = {
  __typename?: 'SpokenLanguage';
  iso639_3: Scalars['String']['output'];
  nameEn: Scalars['String']['output'];
  nameJa: Scalars['String']['output'];
  nameNative: Scalars['String']['output'];
};

export type Submission = {
  __typename?: 'Submission';
  createdDate: Scalars['String']['output'];
  facility?: Maybe<Facility>;
  googleMapsUrl: Scalars['String']['output'];
  healthcareProfessionalName: Scalars['String']['output'];
  healthcareProfessionals?: Maybe<Array<HealthcareProfessional>>;
  id: Scalars['ID']['output'];
  isApproved: Scalars['Boolean']['output'];
  isRejected: Scalars['Boolean']['output'];
  isUnderReview: Scalars['Boolean']['output'];
  spokenLanguages: Array<SpokenLanguage>;
  updatedDate: Scalars['String']['output'];
};

export type SubmissionSearchFilters = {
  createdDate?: InputMaybe<Scalars['String']['input']>;
  googleMapsUrl?: InputMaybe<Scalars['String']['input']>;
  healthcareProfessionalName?: InputMaybe<Scalars['String']['input']>;
  isApproved?: InputMaybe<Scalars['Boolean']['input']>;
  isRejected?: InputMaybe<Scalars['Boolean']['input']>;
  isUnderReview?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<OrderBy>>;
  spokenLanguages?: InputMaybe<Array<SpokenLanguage>>;
  updatedDate?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateFacilityInput = {
  contact?: InputMaybe<Contact>;
  healthcareProfessionalIds?: InputMaybe<Array<Relationship>>;
  id: Scalars['ID']['input'];
  nameEn?: InputMaybe<Scalars['String']['input']>;
  nameJa?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateHealthcareProfessionalInput = {
  acceptedInsurance?: InputMaybe<Array<Insurance>>;
  degrees?: InputMaybe<Array<Degree>>;
  facilityIds?: InputMaybe<Array<Relationship>>;
  id: Scalars['ID']['input'];
  names?: InputMaybe<Array<LocaleName>>;
  specialties?: InputMaybe<Array<Specialty>>;
  spokenLanguages?: InputMaybe<Array<SpokenLanguage>>;
};

export type UpdateSubmissionInput = {
  facility?: InputMaybe<CreateFacilityInput>;
  googleMapsUrl?: InputMaybe<Scalars['String']['input']>;
  healthcareProfessionalName?: InputMaybe<Scalars['String']['input']>;
  healthcareProfessionals?: InputMaybe<Array<CreateHealthcareProfessionalInput>>;
  id: Scalars['ID']['input'];
  isApproved?: InputMaybe<Scalars['Boolean']['input']>;
  isRejected?: InputMaybe<Scalars['Boolean']['input']>;
  isUnderReview?: InputMaybe<Scalars['Boolean']['input']>;
  spokenLanguages?: InputMaybe<Array<SpokenLanguage>>;
};



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;



/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  Contact: ResolverTypeWrapper<Contact>;
  CreateFacilityInput: CreateFacilityInput;
  CreateHealthcareProfessionalInput: CreateHealthcareProfessionalInput;
  CreateSubmissionInput: CreateSubmissionInput;
  Degree: ResolverTypeWrapper<Degree>;
  Facility: ResolverTypeWrapper<Facility>;
  FacilitySearchFilters: FacilitySearchFilters;
  HealthcareProfessional: ResolverTypeWrapper<HealthcareProfessional>;
  HealthcareProfessionalSearchFilters: HealthcareProfessionalSearchFilters;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Insurance: Insurance;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  Locale: Locale;
  LocaleName: ResolverTypeWrapper<LocaleName>;
  Mutation: ResolverTypeWrapper<{}>;
  OrderBy: OrderBy;
  OrderDirection: OrderDirection;
  PhysicalAddress: ResolverTypeWrapper<PhysicalAddress>;
  Query: ResolverTypeWrapper<{}>;
  Relationship: ResolverTypeWrapper<Relationship>;
  RelationshipAction: RelationshipAction;
  Specialty: ResolverTypeWrapper<Specialty>;
  SpecialtyName: ResolverTypeWrapper<SpecialtyName>;
  SpokenLanguage: ResolverTypeWrapper<SpokenLanguage>;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Submission: ResolverTypeWrapper<Submission>;
  SubmissionSearchFilters: SubmissionSearchFilters;
  UpdateFacilityInput: UpdateFacilityInput;
  UpdateHealthcareProfessionalInput: UpdateHealthcareProfessionalInput;
  UpdateSubmissionInput: UpdateSubmissionInput;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Boolean: Scalars['Boolean']['output'];
  Contact: Contact;
  CreateFacilityInput: CreateFacilityInput;
  CreateHealthcareProfessionalInput: CreateHealthcareProfessionalInput;
  CreateSubmissionInput: CreateSubmissionInput;
  Degree: Degree;
  Facility: Facility;
  FacilitySearchFilters: FacilitySearchFilters;
  HealthcareProfessional: HealthcareProfessional;
  HealthcareProfessionalSearchFilters: HealthcareProfessionalSearchFilters;
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  LocaleName: LocaleName;
  Mutation: {};
  OrderBy: OrderBy;
  PhysicalAddress: PhysicalAddress;
  Query: {};
  Relationship: Relationship;
  Specialty: Specialty;
  SpecialtyName: SpecialtyName;
  SpokenLanguage: SpokenLanguage;
  String: Scalars['String']['output'];
  Submission: Submission;
  SubmissionSearchFilters: SubmissionSearchFilters;
  UpdateFacilityInput: UpdateFacilityInput;
  UpdateHealthcareProfessionalInput: UpdateHealthcareProfessionalInput;
  UpdateSubmissionInput: UpdateSubmissionInput;
};

export type ContactResolvers<ContextType = any, ParentType extends ResolversParentTypes['Contact'] = ResolversParentTypes['Contact']> = {
  address?: Resolver<ResolversTypes['PhysicalAddress'], ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  googleMapsUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  phone?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  website?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DegreeResolvers<ContextType = any, ParentType extends ResolversParentTypes['Degree'] = ResolversParentTypes['Degree']> = {
  abbreviation?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  nameEn?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  nameJa?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FacilityResolvers<ContextType = any, ParentType extends ResolversParentTypes['Facility'] = ResolversParentTypes['Facility']> = {
  contact?: Resolver<ResolversTypes['Contact'], ParentType, ContextType>;
  createdDate?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  healthcareProfessionalIds?: Resolver<Array<ResolversTypes['ID']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  nameEn?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  nameJa?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedDate?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type HealthcareProfessionalResolvers<ContextType = any, ParentType extends ResolversParentTypes['HealthcareProfessional'] = ResolversParentTypes['HealthcareProfessional']> = {
  acceptedInsurance?: Resolver<Array<ResolversTypes['Insurance']>, ParentType, ContextType>;
  createdDate?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  degrees?: Resolver<Array<ResolversTypes['Degree']>, ParentType, ContextType>;
  facilityIds?: Resolver<Array<ResolversTypes['ID']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  names?: Resolver<Array<ResolversTypes['LocaleName']>, ParentType, ContextType>;
  specialties?: Resolver<Array<ResolversTypes['Specialty']>, ParentType, ContextType>;
  spokenLanguages?: Resolver<Array<ResolversTypes['SpokenLanguage']>, ParentType, ContextType>;
  updatedDate?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type LocaleNameResolvers<ContextType = any, ParentType extends ResolversParentTypes['LocaleName'] = ResolversParentTypes['LocaleName']> = {
  firstName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  lastName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  locale?: Resolver<ResolversTypes['Locale'], ParentType, ContextType>;
  middleName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  createFacility?: Resolver<Maybe<ResolversTypes['Facility']>, ParentType, ContextType, RequireFields<MutationCreateFacilityArgs, 'input'>>;
  createHealthcareProfessional?: Resolver<Maybe<ResolversTypes['HealthcareProfessional']>, ParentType, ContextType, RequireFields<MutationCreateHealthcareProfessionalArgs, 'input'>>;
  createSubmission?: Resolver<Maybe<ResolversTypes['Submission']>, ParentType, ContextType, RequireFields<MutationCreateSubmissionArgs, 'input'>>;
  deleteFacility?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationDeleteFacilityArgs, 'id'>>;
  deleteHealthcareProfessional?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationDeleteHealthcareProfessionalArgs, 'id'>>;
  deleteSubmission?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<MutationDeleteSubmissionArgs, 'id'>>;
  updateFacility?: Resolver<Maybe<ResolversTypes['Facility']>, ParentType, ContextType, RequireFields<MutationUpdateFacilityArgs, 'id' | 'input'>>;
  updateHealthcareProfessional?: Resolver<Maybe<ResolversTypes['HealthcareProfessional']>, ParentType, ContextType, RequireFields<MutationUpdateHealthcareProfessionalArgs, 'id' | 'input'>>;
  updateSubmission?: Resolver<Maybe<ResolversTypes['Submission']>, ParentType, ContextType, RequireFields<MutationUpdateSubmissionArgs, 'id' | 'input'>>;
};

export type PhysicalAddressResolvers<ContextType = any, ParentType extends ResolversParentTypes['PhysicalAddress'] = ResolversParentTypes['PhysicalAddress']> = {
  addressLine1En?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  addressLine1Ja?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  addressLine2En?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  addressLine2Ja?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  cityEn?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  cityJa?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  postalCode?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  prefectureEn?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  prefectureJa?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  facilities?: Resolver<Maybe<Array<Maybe<ResolversTypes['Facility']>>>, ParentType, ContextType, RequireFields<QueryFacilitiesArgs, 'filters'>>;
  facility?: Resolver<Maybe<ResolversTypes['Facility']>, ParentType, ContextType, RequireFields<QueryFacilityArgs, 'id'>>;
  healthcareProfessional?: Resolver<Maybe<ResolversTypes['HealthcareProfessional']>, ParentType, ContextType, RequireFields<QueryHealthcareProfessionalArgs, 'id'>>;
  healthcareProfessionals?: Resolver<Maybe<Array<Maybe<ResolversTypes['HealthcareProfessional']>>>, ParentType, ContextType, RequireFields<QueryHealthcareProfessionalsArgs, 'filters'>>;
  submission?: Resolver<Maybe<ResolversTypes['Submission']>, ParentType, ContextType, RequireFields<QuerySubmissionArgs, 'id'>>;
  submissions?: Resolver<Maybe<Array<Maybe<ResolversTypes['Submission']>>>, ParentType, ContextType, RequireFields<QuerySubmissionsArgs, 'filters'>>;
};

export type RelationshipResolvers<ContextType = any, ParentType extends ResolversParentTypes['Relationship'] = ResolversParentTypes['Relationship']> = {
  action?: Resolver<ResolversTypes['RelationshipAction'], ParentType, ContextType>;
  otherEntityId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SpecialtyResolvers<ContextType = any, ParentType extends ResolversParentTypes['Specialty'] = ResolversParentTypes['Specialty']> = {
  names?: Resolver<Array<ResolversTypes['SpecialtyName']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SpecialtyNameResolvers<ContextType = any, ParentType extends ResolversParentTypes['SpecialtyName'] = ResolversParentTypes['SpecialtyName']> = {
  locale?: Resolver<ResolversTypes['Locale'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SpokenLanguageResolvers<ContextType = any, ParentType extends ResolversParentTypes['SpokenLanguage'] = ResolversParentTypes['SpokenLanguage']> = {
  iso639_3?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  nameEn?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  nameJa?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  nameNative?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SubmissionResolvers<ContextType = any, ParentType extends ResolversParentTypes['Submission'] = ResolversParentTypes['Submission']> = {
  createdDate?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  facility?: Resolver<Maybe<ResolversTypes['Facility']>, ParentType, ContextType>;
  googleMapsUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  healthcareProfessionalName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  healthcareProfessionals?: Resolver<Maybe<Array<ResolversTypes['HealthcareProfessional']>>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isApproved?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isRejected?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isUnderReview?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  spokenLanguages?: Resolver<Array<ResolversTypes['SpokenLanguage']>, ParentType, ContextType>;
  updatedDate?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Resolvers<ContextType = any> = {
  Contact?: ContactResolvers<ContextType>;
  Degree?: DegreeResolvers<ContextType>;
  Facility?: FacilityResolvers<ContextType>;
  HealthcareProfessional?: HealthcareProfessionalResolvers<ContextType>;
  LocaleName?: LocaleNameResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  PhysicalAddress?: PhysicalAddressResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Relationship?: RelationshipResolvers<ContextType>;
  Specialty?: SpecialtyResolvers<ContextType>;
  SpecialtyName?: SpecialtyNameResolvers<ContextType>;
  SpokenLanguage?: SpokenLanguageResolvers<ContextType>;
  Submission?: SubmissionResolvers<ContextType>;
};

