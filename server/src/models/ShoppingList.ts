import mongoose, { Schema } from 'mongoose';

interface IShoppingItem {
  _id?: mongoose.Types.ObjectId;
  name: string;
  amount: string;
  recipeId?: mongoose.Types.ObjectId;
  recipeTitle?: string;
  isChecked: boolean;
}

interface IShoppingList {
  _id: mongoose.Types.ObjectId;
  owner: mongoose.Types.ObjectId;
  items: IShoppingItem[];
  createdAt: Date;
  updatedAt: Date;
}

const shoppingItemSchema = new Schema<IShoppingItem>({
  name: { type: String, required: true },
  amount: { type: String, required: true },
  recipeId: { type: Schema.Types.ObjectId, ref: 'Recipe' },
  recipeTitle: { type: String },
  isChecked: { type: Boolean, default: false },
});

const shoppingListSchema = new Schema<IShoppingList>(
  {
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [shoppingItemSchema],
  },
  { timestamps: true },
);

export default mongoose.model<IShoppingList>('ShoppingList', shoppingListSchema);
export type { IShoppingList, IShoppingItem };
