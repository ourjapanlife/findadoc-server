
export default interface responseType<Type> {
    body: {
        data: {
            [x: string]: Type;
        }
    }     
}   
