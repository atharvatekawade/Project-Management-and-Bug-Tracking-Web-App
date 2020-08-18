import React, { Component } from 'react';
import axios from 'axios';

export default class Info extends Component {
    constructor(props){
        super(props);
        this.state={
            client:{}
        }
    }
    componentDidMount(){
        axios.get('/viewclient/'+this.props.client)
            .then(res => this.setState({client:res.data}))
    }
    render(){
        return(
            <tr>
                <th scope="row">{this.props.i}.</th>
                <td>{this.state.client.name}</td>
                <td>{this.state.client.email}</td>
                <td>+91{this.state.client.phone}</td>
                <td>{this.state.client.current}</td>
                <td>{this.state.client.total}</td>
                
            </tr>
        )
    }
}