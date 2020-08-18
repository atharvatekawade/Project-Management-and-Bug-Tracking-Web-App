import 'bootstrap/dist/css/bootstrap.min.css';
import React, { Component } from 'react';
import axios from 'axios';
import { Dropdown } from 'semantic-ui-react'
import $ from 'jquery';

export default class Home extends Component{
    constructor(props){
        super(props);
        this.state={
            bugs:[],
            bug:''
        }
        this.handleChange=this.handleChange.bind(this);
    }
    
    componentDidMount(){
        axios.get('/bugs')
            .then((res) => {
                let arr=[];
                for(let i=0;i<res.data.length;i++){
                    arr.push({key:res.data[i].title,value:res.data[i].bug_id,text:res.data[i].title})
                }
                this.setState({bugs:arr})
            })
    }

    handleChange(e, data){
        console.log(data.value);
        this.setState({ bug: data.value });
    }

    render(){
        return(
            <div className="field container">
                <label><b>Search for Bug:</b></label>
                <Dropdown placeholder='Bug' search selection options={this.state.bugs} onChange={this.handleChange} id='bug' value={this.state.bug} name='bug' className='ml-2' />
                <br />
                {this.state.bug.toString().length>0 && 
                    <a href={'/bugtracker/'+this.state.bug.toString()} className='btn btn-success'>Go >></a>
                }
                {this.state.bug.toString().length==0 && 
                    <a href='#' className='btn btn-success'>Go >></a>
                }
            </div>
        )
    }
}