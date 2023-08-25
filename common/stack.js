export class Stack { 
  
    // Array is used to implement stack 
    constructor() 
    { 
        this.items = []; 
    }
    // push function 
    push(element) 
    { 
        // push element into the list items 
        this.items.push(element); 
    } 
    // pop function 
    pop() 
    { 
        if (this.items.length == 0) 
            return undefined; 
        return this.items.pop(); 
    } 
    
    //remove first occurence of value
    remove(value) 
    {
        var retValue = undefined;
        var index = this.items.indexOf(value);

        console.log("value=" + value);
        console.log("index=" + index);

        if (index > -1) {
            retValue = this.items[index];
            this.items.splice(index, 1);
        }

        return retValue;
    }

    // isEmpty function 
    isEmpty() 
    { 
        // return true if stack is empty 
        return this.items.length == 0; 
    } 

    // peek function 
    peek() 
    { 
        
        return this.items[this.items.length - 1]; 
    }

    //filter function
    filter(func)
    {
        return this.items.filter(func);
    }

}
