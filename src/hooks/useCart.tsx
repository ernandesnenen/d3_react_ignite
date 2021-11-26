import { createContext, ReactNode, useContext, useState } from 'react';

import { toast } from 'react-toastify';
// import { isTemplateTail } from 'typescript';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}



const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [amount, setAmount] = useState(0)
  const [cart, setCart] = useState<Product[]>(() => {
   const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
     return [];
  });
  

  const addProduct = async (productId: number) => {
    
    try {
      const updateCart = [...cart]
      const product = updateCart.find(product => product.id === productId)
      const {data} = await api.get<Stock>(`/stock/${productId}`)

      const stockAmount =  data.amount
      const currentAmount = product ? product.amount : 0
      const amount = currentAmount + 1
      
      
      if(stockAmount < amount){
       toast.error('Quantidade solicitada fora de estoque');
       return
        
      }

      if(product){
          product.amount = amount
      }else{
        const newProduct = await api.get(`/products/${productId}`)
        const productNew = {
          ...newProduct.data,
          amount: 1
        }
        updateCart.push(productNew)
      }
      setCart(updateCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart))       
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updateCart = [...cart]
      const cartIndex =  updateCart.findIndex( product => product.id === productId)
      if(cartIndex<0){
        toast.error('Erro na remoção do produto');
        return
      }
      updateCart.splice(cartIndex, 1)
      setCart(updateCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart)) 

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    
    try {
      const updateCart = [...cart]
      const {data} = await api.get<Stock>(`/stock/${productId}`)
      const stockAmount =  data.amount


      if(amount <= 0){
        return
      }

      if(amount > stockAmount){
        toast.error('Quantidade solicitada fora de estoque');
        return
      }
      const product =  updateCart.find( product => product.id === productId)
      if(product){
        product.amount = amount 
        setCart(updateCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart)) 
      }else{
        throw Error()
      }
     

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
