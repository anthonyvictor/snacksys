import { Model, model, models, Schema } from "mongoose";

export interface IProductCategory {
  id: string;
  name: string;
  description?: string;
  regex?: string;
  tags: string[];
  position: number;
  products: IProduct[];
  createdAt: Date;
  updatedAt: Date;
  sort: ISort[];
}

export interface IProductModifierCategory {
  id: string;
  name: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProductModifierOptionFinal {
  original: IProductModifierOption;
  price: number;
  active: boolean;
}
export interface IProductModifierFinal {
  original: IProductModifier;
  options: IProductModifierOptionFinal[];
  min: number;
  max: number;
  active: boolean;
  position: number;
}

export interface IProductModifierOption {
  id: string;
  internalName: string;
  displayName: string;
  description?: string;
  category?: IProductModifierCategory;
  imageUrl?: string;
  stock?: number;
  sales: number;
  active: boolean;
}

type IProductModifierPricingStrategy = "sum" | "average" | "highest" | "lowest";
type ISort =
  | "nameAsc"
  | "nameDesc"
  | "salesDesc"
  | "salesAsc"
  | "priceAsc"
  | "priceDesc";

export interface IProductModifier {
  id: string;
  displayName: string;
  internalName: string;
  description?: string;
  options: IProductModifierOption[];
  repeatable: boolean;
  active: boolean;
  pricingStrategy: IProductModifierPricingStrategy;
  sort: ISort[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IProduct {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  category: IProductCategory;
  modifiers: IProductModifierFinal[];
  basePrice: number;
  regex?: string;
  active: boolean;
  imageUrl?: string;
  sales: number;
  createdAt: Date;
  updatedAt: Date;
  stock?: number;
  extraInfo?: {
    sizeCm?: number;
    capacityMl?: number;
    weightInG?: number;
    slices?: number;
  };
}

// const opcoes = [
//   {name: 'calabresa', context: 'pizza', stock: '*' },
//   {name: 'frango', context: 'pizza', stock: '*' },
//   {name: 'presunto', context: 'pizza', stock: '*' },
//   {name: 'goiabada', context: 'pizza', stock: '*' },
//   {name: 'calabresa', context: 'bauru', stock: '*'},
//   {name: 'mussarela', context: 'bauru', stock: '*'},
// ] as IProductModifierOption[]

// const saboresDePizza: IProductModifierOptionGroup = {
//   name: 'sabores-de-pizza',
//   options: [

//   ]
// } as IProductModifierOptionGroup

// export type IProductModifierMode = 'sum'|'mid'|'most-expensive'|'most-cheap'

// export interface IProductModifier {
//   id: string
//   name: string
//   description?: string
//   optionGroup: IProductModifierOptionGroup
//   min: number
//   max: number
// }

// const produtos: IProduct[] = [
//   {name: 'Pizza grande', modifiers: } as IProduct
// ]

const opcoes: {
  frango: IProductModifierOption;
  calabresa: IProductModifierOption;
  presunto: IProductModifierOption;
} = {
  frango: {
    id: "",
    internalName: "Frango de pizza",
    displayName: "Frango",
    description: "Mussarela, frango, requeijão e orégano",
    active: true,
    sales: 50,
  },
  calabresa: {
    id: "",
    internalName: "Calabresa de pizza",
    displayName: "Calabresa",
    description: "Mussarela, calabresa, cebola e orégano",
    active: true,
    sales: 80,
  },
  presunto: {
    id: "",
    internalName: "Presunto de pizza",
    displayName: "Presunto",
    description: "Mussarela, presunto, cheddar e orégano",
    active: true,
    sales: 20,
  },
};

const saboresDePizza: IProductModifier = {
  id: "",
  internalName: "sabores de pizza",
  displayName: "Sabores",
  active: true,
  options: [opcoes.calabresa, opcoes.frango, opcoes.presunto],
  pricingStrategy: "average",
  repeatable: true,
  sort: ["priceAsc", "nameAsc"],
  createdAt: new Date(),
  updatedAt: new Date(),
};

const categorias: {
  pizzas: IProductCategory;
} = {
  pizzas: {
    id: "",
    name: "Pizzas",
    position: 0,
    products: [],
    tags: [],
    sort: ["priceDesc"],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

const pizzas: {
  grande: IProduct;
  media: IProduct;
} = {
  grande: {
    id: "",
    name: "Pizza Grande",
    description: "8 fatias, 3 sabores, 35cm",
    basePrice: 0,
    sales: 50,
    tags: [],
    modifiers: [
      {
        original: saboresDePizza,
        options: [
          {
            original: opcoes.calabresa,
            price: 35,
            active: true,
          },
          {
            original: opcoes.presunto,
            price: 35,
            active: true,
          },
          {
            original: opcoes.frango,
            price: 40,
            active: true,
          },
        ],
        position: 0,
        min: 1,
        max: 3,
        active: true,
      },
    ],
    active: true,
    category: categorias.pizzas,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  media: {
    id: "",
    name: "Pizza Média",
    description: "6 fatias, 2 sabores, 30cm",
    basePrice: 0,
    sales: 50,
    tags: [],
    modifiers: [
      {
        original: saboresDePizza,
        options: [
          {
            original: opcoes.calabresa,
            price: 30,
            active: true,
          },
          {
            original: opcoes.presunto,
            price: 30,
            active: true,
          },
          {
            original: opcoes.frango,
            price: 35,
            active: true,
          },
        ],
        position: 0,
        min: 1,
        max: 3,
        active: true,
      },
    ],
    active: true,
    category: categorias.pizzas,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};

const ProductCategorySchema = new Schema<IProductCategory>(
  {
    name: { type: String, required: true },
    description: String,
    tags: { type: [String], default: [] },
    regex: String,
    position: { type: Number, required: true },
  },
  { timestamps: true }
);

const ProductModifierCategorySchema = new Schema<IProductCategory>(
  {
    name: { type: String, required: true },
    position: { type: Number, required: true },
  },
  { timestamps: true }
);

const ProductModifierOptionSchema = new Schema<IProductModifierOption>(
  {
    internalName: { type: String, required: true },
    displayName: { type: String, required: true },
    description: { type: String },
    category: { type: ProductModifierCategorySchema },
    active: { type: Boolean, required: true, default: true },
    imageUrl: { type: String },
    stock: { type: Number },
    sales: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

const ProductModifierSchema = new Schema<IProductModifier>(
  {
    internalName: { type: String, required: true },
    displayName: { type: String, required: true },
    description: { type: String },
    options: [
      {
        type: { type: Schema.Types.ObjectId, ref: "ProductModifier" },
        price: { type: Number, required: true },
      },
    ],
    active: { type: Boolean, required: true, default: true },
    repeatable: { type: Boolean, required: true },
    pricingStrategy: {
      type: String,
      enum: ["sum", "average", "highest", "lowest"],
    },
    sort: [
      {
        type: String,
        enum: ["priceAsc", "priceDesc", "salesAsc", "salesDesc"],
      },
    ],
  },
  { timestamps: true }
);

const ProductModifierOptionFinalSchema =
  new Schema<IProductModifierOptionFinal>({
    original: {
      type: Schema.Types.ObjectId,
      ref: "ProductModifierOption",
      required: true,
    },
    price: { type: Number, required: true },
    active: Boolean,
  });

const ProductModifierFinalSchema = new Schema<IProductModifierFinal>({
  original: {
    type: Schema.Types.ObjectId,
    ref: "ProductModifier",
    required: true,
  },
  options: {
    type: [ProductModifierOptionFinalSchema],
    required: true,
    default: [],
  },
  min: { type: Number, required: true },
  max: { type: Number, required: true },
  active: { type: Boolean, required: true },
  position: { type: Number, required: true },
});

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true },
    description: { type: String },
    regex: { type: String },
    tags: { type: [String], default: [] },
    // type: {
    //   type: String,
    //   enum: ["snack", "pizza", "drink", "dessert", "meal", "other"],
    // },
    category: {
      type: Schema.Types.ObjectId,
      ref: "ProductCategory",
      required: true,
    },
    modifiers: {
      type: [ProductModifierFinalSchema],
      required: true,
      default: [],
    },
    basePrice: { type: Number, required: true },
    sales: { type: Number, default: 0 },
    imageUrl: { type: String },
    active: { type: Boolean, default: true },
    stock: Number,
  },
  { timestamps: true }
);

export const ProductModel =
  (models.Product as Model<IProduct>) ||
  model<IProduct>("Product", ProductSchema);

export const ProductCategoryModel =
  (models.ProductCategory as Model<IProductCategory>) ||
  model<IProductCategory>("ProductCategory", ProductCategorySchema);

export const ProductModifierModel =
  (models.ProductModifier as Model<IProductModifier>) ||
  model<IProductModifier>("ProductModifier", ProductModifierSchema);

export const ProductModifierOptionModel =
  (models.ProductModifierOption as Model<IProductModifierOption>) ||
  model<IProductModifierOption>(
    "ProductModifierOption",
    ProductModifierOptionSchema
  );
