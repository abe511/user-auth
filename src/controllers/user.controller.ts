import { Request, Response} from "express";


export const getUserById = (req: Request, res: Response) => {
    console.log({body:req.body});
    const userId = req.params["id"];
    res.status(200).json({userId});
};

export const getAllUsers = (req: Request, res: Response) => {
    res.status(200).json({data: "all users"});
};

export const createUser = (req: Request, res: Response) => {
    console.log(req.body);
    res.json({data: "new user created"});
};

export const updateUser = (req: Request, res: Response) => {
    console.log(req.body);
    const userId = req.params["id"];
    res.json({data:`user ${userId} updated`});
};

export const deleteUser = (req: Request, res: Response) => {
    const userId = req.params["id"];
    res.json({data: `user ${userId} removed`});
};