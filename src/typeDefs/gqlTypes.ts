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
  mapsLink: Scalars['String']['output'];
  phone: Scalars['String']['output'];
  website: Scalars['String']['output'];
};

export type ContactInput = {
  address: PhysicalAddressInput;
  email: Scalars['String']['input'];
  mapsLink: Scalars['String']['input'];
  phone: Scalars['String']['input'];
  website: Scalars['String']['input'];
};

export type Degree = {
  __typename?: 'Degree';
  abbreviation: Scalars['String']['output'];
  nameEn: Scalars['String']['output'];
  nameJa: Scalars['String']['output'];
};

export type DegreeInput = {
  abbreviation?: InputMaybe<Scalars['String']['input']>;
  nameEn?: InputMaybe<Scalars['String']['input']>;
  nameJa?: InputMaybe<Scalars['String']['input']>;
};

export type Facility = {
  __typename?: 'Facility';
  contact: Contact;
  createdDate: Scalars['String']['output'];
  healthcareProfessionalIds: Array<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isDeleted: Scalars['Boolean']['output'];
  nameEn: Scalars['String']['output'];
  nameJa: Scalars['String']['output'];
  updatedDate: Scalars['String']['output'];
};

export type FacilityInput = {
  contact: ContactInput;
  healthcareProfessionalIds: Array<Scalars['String']['input']>;
  healthcareProfessionals: Array<HealthcareProfessionalInput>;
  nameEn: Scalars['String']['input'];
  nameJa: Scalars['String']['input'];
};

export type FacilitySearchFilters = {
  contact?: InputMaybe<ContactInput>;
  createdDate?: InputMaybe<Scalars['String']['input']>;
  healthcareProfessionalName?: InputMaybe<Scalars['String']['input']>;
  isDeleted?: InputMaybe<Scalars['Boolean']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  nameEn?: InputMaybe<Scalars['String']['input']>;
  nameJa?: InputMaybe<Scalars['String']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Array<InputMaybe<OrderBy>>>;
  updatedDate?: InputMaybe<Scalars['String']['input']>;
};

export type HealthcareProfessional = {
  __typename?: 'HealthcareProfessional';
  acceptedInsurance: Array<Insurance>;
  createdDate: Scalars['String']['output'];
  degrees: Array<Degree>;
  id: Scalars['ID']['output'];
  isDeleted: Scalars['Boolean']['output'];
  names: Array<LocaleName>;
  specialties: Array<Specialty>;
  spokenLanguages: Array<SpokenLanguage>;
  updatedDate: Scalars['String']['output'];
};

export type HealthcareProfessionalInput = {
  acceptedInsurance: Array<Insurance>;
  degrees: Array<DegreeInput>;
  names: Array<LocaleNameInput>;
  specialties: Array<SpecialtyInput>;
  spokenLanguages: Array<SpokenLanguageInput>;
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

export type LocaleNameInput = {
  firstName: Scalars['String']['input'];
  lastName: Scalars['String']['input'];
  locale: Locale;
  middleName?: InputMaybe<Scalars['String']['input']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  createFacilityWithHealthcareProfessional?: Maybe<Facility>;
  createHealthcareProfessional?: Maybe<HealthcareProfessional>;
  createSubmission?: Maybe<Submission>;
  updateHealthcareProfessional?: Maybe<HealthcareProfessional>;
  updateSubmission?: Maybe<Submission>;
};


export type MutationCreateFacilityWithHealthcareProfessionalArgs = {
  input?: InputMaybe<FacilityInput>;
};


export type MutationCreateHealthcareProfessionalArgs = {
  input?: InputMaybe<HealthcareProfessionalInput>;
};


export type MutationCreateSubmissionArgs = {
  input?: InputMaybe<SubmissionInput>;
};


export type MutationUpdateHealthcareProfessionalArgs = {
  id: Scalars['ID']['input'];
  input?: InputMaybe<HealthcareProfessionalInput>;
};


export type MutationUpdateSubmissionArgs = {
  id: Scalars['ID']['input'];
  input?: InputMaybe<SubmissionInput>;
};

export type OrderBy = {
  fieldToOrder?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<OrderDirection>;
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

export type PhysicalAddressInput = {
  addressLine1En?: InputMaybe<Scalars['String']['input']>;
  addressLine1Ja?: InputMaybe<Scalars['String']['input']>;
  addressLine2En?: InputMaybe<Scalars['String']['input']>;
  addressLine2Ja?: InputMaybe<Scalars['String']['input']>;
  cityEn?: InputMaybe<Scalars['String']['input']>;
  cityJa?: InputMaybe<Scalars['String']['input']>;
  postalCode?: InputMaybe<Scalars['String']['input']>;
  prefectureEn?: InputMaybe<Scalars['String']['input']>;
  prefectureJa?: InputMaybe<Scalars['String']['input']>;
};

export type Query = {
  __typename?: 'Query';
  facilities?: Maybe<Array<Maybe<Facility>>>;
  facility?: Maybe<Facility>;
  healthcareProfessional?: Maybe<HealthcareProfessional>;
  healthcareProfessionals?: Maybe<Array<Maybe<HealthcareProfessional>>>;
  specialties?: Maybe<Array<Maybe<Specialty>>>;
  specialty?: Maybe<Specialty>;
  spokenLanguage?: Maybe<SpokenLanguage>;
  spokenLanguages?: Maybe<Array<Maybe<SpokenLanguage>>>;
  submission?: Maybe<Submission>;
  submissions?: Maybe<Array<Maybe<Submission>>>;
};


export type QueryFacilitiesArgs = {
  filters?: InputMaybe<FacilitySearchFilters>;
};


export type QueryFacilityArgs = {
  id: Scalars['ID']['input'];
};


export type QueryHealthcareProfessionalArgs = {
  id: Scalars['ID']['input'];
};


export type QuerySpecialtyArgs = {
  id: Scalars['ID']['input'];
};


export type QuerySpokenLanguageArgs = {
  iso639_3: Scalars['String']['input'];
};


export type QuerySubmissionArgs = {
  id: Scalars['ID']['input'];
};


export type QuerySubmissionsArgs = {
  filters?: InputMaybe<SubmissionSearchFilters>;
};

export type Specialty = {
  __typename?: 'Specialty';
  names: Array<SpecialtyName>;
};

export type SpecialtyInput = {
  names?: InputMaybe<Array<InputMaybe<SpecialtyNameInput>>>;
};

export type SpecialtyName = {
  __typename?: 'SpecialtyName';
  locale: Locale;
  name: Scalars['String']['output'];
};

export type SpecialtyNameInput = {
  locale?: InputMaybe<Locale>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type SpokenLanguage = {
  __typename?: 'SpokenLanguage';
  iso639_3: Scalars['String']['output'];
  nameEn: Scalars['String']['output'];
  nameJa: Scalars['String']['output'];
  nameNative: Scalars['String']['output'];
};

export type SpokenLanguageInput = {
  iso639_3: Scalars['String']['input'];
  nameEn: Scalars['String']['input'];
  nameJa: Scalars['String']['input'];
  nameNative: Scalars['String']['input'];
};

export type Submission = {
  __typename?: 'Submission';
  createdDate: Scalars['String']['output'];
  googleMapsUrl: Scalars['String']['output'];
  healthcareProfessionalName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isApproved: Scalars['Boolean']['output'];
  isRejected: Scalars['Boolean']['output'];
  isUnderReview: Scalars['Boolean']['output'];
  spokenLanguages: Array<Maybe<SpokenLanguage>>;
  updatedDate: Scalars['String']['output'];
};

export type SubmissionInput = {
  googleMapsUrl: Scalars['String']['input'];
  healthcareProfessionalName: Scalars['String']['input'];
  spokenLanguages: Array<InputMaybe<SpokenLanguageInput>>;
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
  orderBy?: InputMaybe<Array<InputMaybe<OrderBy>>>;
  spokenLanguages?: InputMaybe<Array<InputMaybe<SpokenLanguageInput>>>;
  updatedDate?: InputMaybe<Scalars['String']['input']>;
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
  ContactInput: ContactInput;
  Degree: ResolverTypeWrapper<Degree>;
  DegreeInput: DegreeInput;
  Facility: ResolverTypeWrapper<Facility>;
  FacilityInput: FacilityInput;
  FacilitySearchFilters: FacilitySearchFilters;
  HealthcareProfessional: ResolverTypeWrapper<HealthcareProfessional>;
  HealthcareProfessionalInput: HealthcareProfessionalInput;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Insurance: Insurance;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  Locale: Locale;
  LocaleName: ResolverTypeWrapper<LocaleName>;
  LocaleNameInput: LocaleNameInput;
  Mutation: ResolverTypeWrapper<{}>;
  OrderBy: OrderBy;
  OrderDirection: OrderDirection;
  PhysicalAddress: ResolverTypeWrapper<PhysicalAddress>;
  PhysicalAddressInput: PhysicalAddressInput;
  Query: ResolverTypeWrapper<{}>;
  Specialty: ResolverTypeWrapper<Specialty>;
  SpecialtyInput: SpecialtyInput;
  SpecialtyName: ResolverTypeWrapper<SpecialtyName>;
  SpecialtyNameInput: SpecialtyNameInput;
  SpokenLanguage: ResolverTypeWrapper<SpokenLanguage>;
  SpokenLanguageInput: SpokenLanguageInput;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Submission: ResolverTypeWrapper<Submission>;
  SubmissionInput: SubmissionInput;
  SubmissionSearchFilters: SubmissionSearchFilters;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  Boolean: Scalars['Boolean']['output'];
  Contact: Contact;
  ContactInput: ContactInput;
  Degree: Degree;
  DegreeInput: DegreeInput;
  Facility: Facility;
  FacilityInput: FacilityInput;
  FacilitySearchFilters: FacilitySearchFilters;
  HealthcareProfessional: HealthcareProfessional;
  HealthcareProfessionalInput: HealthcareProfessionalInput;
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  LocaleName: LocaleName;
  LocaleNameInput: LocaleNameInput;
  Mutation: {};
  OrderBy: OrderBy;
  PhysicalAddress: PhysicalAddress;
  PhysicalAddressInput: PhysicalAddressInput;
  Query: {};
  Specialty: Specialty;
  SpecialtyInput: SpecialtyInput;
  SpecialtyName: SpecialtyName;
  SpecialtyNameInput: SpecialtyNameInput;
  SpokenLanguage: SpokenLanguage;
  SpokenLanguageInput: SpokenLanguageInput;
  String: Scalars['String']['output'];
  Submission: Submission;
  SubmissionInput: SubmissionInput;
  SubmissionSearchFilters: SubmissionSearchFilters;
};

export type ContactResolvers<ContextType = any, ParentType extends ResolversParentTypes['Contact'] = ResolversParentTypes['Contact']> = {
  address?: Resolver<ResolversTypes['PhysicalAddress'], ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  mapsLink?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  phone?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  website?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
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
  healthcareProfessionalIds?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isDeleted?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  nameEn?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  nameJa?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedDate?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type HealthcareProfessionalResolvers<ContextType = any, ParentType extends ResolversParentTypes['HealthcareProfessional'] = ResolversParentTypes['HealthcareProfessional']> = {
  acceptedInsurance?: Resolver<Array<ResolversTypes['Insurance']>, ParentType, ContextType>;
  createdDate?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  degrees?: Resolver<Array<ResolversTypes['Degree']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isDeleted?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
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
  createFacilityWithHealthcareProfessional?: Resolver<Maybe<ResolversTypes['Facility']>, ParentType, ContextType, Partial<MutationCreateFacilityWithHealthcareProfessionalArgs>>;
  createHealthcareProfessional?: Resolver<Maybe<ResolversTypes['HealthcareProfessional']>, ParentType, ContextType, Partial<MutationCreateHealthcareProfessionalArgs>>;
  createSubmission?: Resolver<Maybe<ResolversTypes['Submission']>, ParentType, ContextType, Partial<MutationCreateSubmissionArgs>>;
  updateHealthcareProfessional?: Resolver<Maybe<ResolversTypes['HealthcareProfessional']>, ParentType, ContextType, RequireFields<MutationUpdateHealthcareProfessionalArgs, 'id'>>;
  updateSubmission?: Resolver<Maybe<ResolversTypes['Submission']>, ParentType, ContextType, RequireFields<MutationUpdateSubmissionArgs, 'id'>>;
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
  facilities?: Resolver<Maybe<Array<Maybe<ResolversTypes['Facility']>>>, ParentType, ContextType, Partial<QueryFacilitiesArgs>>;
  facility?: Resolver<Maybe<ResolversTypes['Facility']>, ParentType, ContextType, RequireFields<QueryFacilityArgs, 'id'>>;
  healthcareProfessional?: Resolver<Maybe<ResolversTypes['HealthcareProfessional']>, ParentType, ContextType, RequireFields<QueryHealthcareProfessionalArgs, 'id'>>;
  healthcareProfessionals?: Resolver<Maybe<Array<Maybe<ResolversTypes['HealthcareProfessional']>>>, ParentType, ContextType>;
  specialties?: Resolver<Maybe<Array<Maybe<ResolversTypes['Specialty']>>>, ParentType, ContextType>;
  specialty?: Resolver<Maybe<ResolversTypes['Specialty']>, ParentType, ContextType, RequireFields<QuerySpecialtyArgs, 'id'>>;
  spokenLanguage?: Resolver<Maybe<ResolversTypes['SpokenLanguage']>, ParentType, ContextType, RequireFields<QuerySpokenLanguageArgs, 'iso639_3'>>;
  spokenLanguages?: Resolver<Maybe<Array<Maybe<ResolversTypes['SpokenLanguage']>>>, ParentType, ContextType>;
  submission?: Resolver<Maybe<ResolversTypes['Submission']>, ParentType, ContextType, RequireFields<QuerySubmissionArgs, 'id'>>;
  submissions?: Resolver<Maybe<Array<Maybe<ResolversTypes['Submission']>>>, ParentType, ContextType, Partial<QuerySubmissionsArgs>>;
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
  googleMapsUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  healthcareProfessionalName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isApproved?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isRejected?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isUnderReview?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  spokenLanguages?: Resolver<Array<Maybe<ResolversTypes['SpokenLanguage']>>, ParentType, ContextType>;
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
  Specialty?: SpecialtyResolvers<ContextType>;
  SpecialtyName?: SpecialtyNameResolvers<ContextType>;
  SpokenLanguage?: SpokenLanguageResolvers<ContextType>;
  Submission?: SubmissionResolvers<ContextType>;
};
