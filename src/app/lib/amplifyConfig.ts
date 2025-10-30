import outputs from "../../../amplify_outputs.json";
import { Amplify } from "aws-amplify";

// Inicializa Amplify con los outputs del sandbox
Amplify.configure(outputs);
