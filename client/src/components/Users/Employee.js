import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Dropdown } from 'semantic-ui-react'
import $ from 'jquery';

export default class Employee extends Component {
    constructor(props){
        super(props);
        this.state={
            employees:[],
            employee:''
        }
        this.handleChange=this.handleChange.bind(this);
    }
    componentDidMount(){
        axios.get('/viewemployees')
            .then((res) => {
                console.log(res.data)
                let arr=[];
                for(let i=0;i<res.data.length;i++){
                    arr.push({key:res.data[i].name+'-'+res.data[i].branch,value:res.data[i].name+'-'+res.data[i].branch,text:res.data[i].name+'-'+res.data[i].branch})
                }
                this.setState({employees:arr})
            })
    }

    handleChange(e, data){
        console.log(data.value);
        this.setState({ employee: data.value });
    }


    render(){
        return(
            <div>
                <div style={{marginLeft:"38%"}} className='mt-3'>
                    <div className="field">
                        <label><b>Search for Employee Name:</b></label>
                        <Dropdown placeholder='Employee' search selection options={this.state.employees} onChange={this.handleChange} id='employe' value={this.state.employe} name='employe' className='ml-2' />
                    </div>
                    <br />
                    {this.state.employee.length > 0 &&
                        <a href={'/employee/'+this.state.employee} className='btn btn-success' disabled>View Employee Information</a>
                    }
                    {this.state.employee.length === 0 &&
                        <a href='#' className='btn btn-success' disabled>View Employee Information</a>
                    }
                    
                    <br />
                    <a href='/addemployee' className='mt-3 btn btn-primary' style={{position:"relative",top:"-47px",right:"-200px"}}>Add New Employee >></a>

                </div>
            </div>
        )
    }
}