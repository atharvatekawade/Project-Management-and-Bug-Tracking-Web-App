import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Dropdown } from 'semantic-ui-react'
import $ from 'jquery';
import Info from './Info';

export default class Client extends Component {
    constructor(props){
        super(props);
        this.state={
            clients:[],
            msg:''
        }
        this.deleteExercise = this.deleteExercise.bind(this);
    }

    componentDidMount(){
        axios.get('/viewallclients')
            .then(res => this.setState({clients:res.data}))
    }

    deleteExercise(id) {
        axios.delete('/client/'+id)
          .then(res => this.setState({msg:res.data,clients:this.state.clients.filter(el => el.client_id != id)}));
    
        /*this.setState({
          exercises: this.state.exercises.filter(el => el._id !== id)
        })*/
    }
    
    render(){
        return(
            <div className='container'>
                <br />
                <a href='/addclient' className='btn btn-success'>Add New Client >></a>
                <br />
                <br />
                <table class="table">
                    <thead>
                    <tr style={{backgroundColor: "rgba(30,145,150)", color: "white"}}>
                        <th scope="col">S.N.</th>
                        <th scope="col">Name</th>
                        <th scope="col">Mail</th>
                        <th scope="col">Phone</th>
                        <th scope="col">#Current Projects</th>
                        <th scope="col">#Total Projects</th>
                    </tr>
                    </thead>
                    <tbody>
                        {this.state.clients.map((currentexercise,index) => {
                        return <Info client={currentexercise.client_id} deleteExercise={this.deleteExercise} i={index+1}  key={currentexercise.client_id}/>;
                      })}
                    </tbody>
                </table>
            </div>
        )
    }
}